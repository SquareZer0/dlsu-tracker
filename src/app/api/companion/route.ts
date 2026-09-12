import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, isAuthedCookie } from "@/lib/auth";
import { getUserSnapshot, formatSnapshot } from "@/lib/snapshot";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { createAssignment } from "@/lib/assignments";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic();

// Both modes read claude-sonnet-5 here — swap QUERY_MODEL to
// "claude-haiku-4-5-20251001" if interactive replies feel slow.
const DIGEST_MODEL = "claude-sonnet-5";
const QUERY_MODEL = "claude-sonnet-5";

const TOPICS = ["workload", "budget", "schedule"] as const;
type Topic = (typeof TOPICS)[number];

const SYSTEM_PROMPT =
  "You are a cheerful, slightly cheeky pixel companion living in a student's dashboard app — think supportive " +
  "friend, not customer support. Reply in 1-3 short sentences, plain text only — no markdown, no bullet points, " +
  "no headers. Warm and playful: teasing is fine, a stray emoticon or 'ehe' is fine, but don't be sappy or overdo " +
  "it — still get to the point fast. Use the SNAPSHOT data below when it's relevant to what's asked, and never " +
  "invent numbers or deadlines that aren't in it. " +
  'Before your reply, output exactly one line containing only a JSON object tagging its topic: {"topic":"workload"} ' +
  'for assignments/exams/deadlines, {"topic":"budget"} for money/spending, or {"topic":"schedule"} for classes, ' +
  "calendar, or anything else. " +
  "If — and only if — the user is clearly asking you to DO something (not just answer a question), also include " +
  'an "action" field on that same JSON object — two kinds:\n' +
  '  - Calendar event (a meeting, class, activity — something with a start and end time): {"topic":"schedule",' +
  '"action":{"type":"create_event","title":"...","start":"2026-09-10T15:00:00+08:00","end":"2026-09-10T16:00:00+08:00",' +
  '"location":"..."}}. If no end time is given, make it 1 hour long. location is optional — omit it if not mentioned.\n' +
  '  - Assignment (a task/deliverable to track, not a calendar slot — "add an assignment", "remind me to submit X"): ' +
  '{"topic":"workload","action":{"type":"create_assignment","course":"...","title":"...","dueAt":"2026-09-12T23:59:00+08:00"}}. ' +
  "If no time is given, default dueAt to 11:59 PM that day.\n" +
  "Resolve relative dates/times (\"tomorrow at 3\", \"next Friday\") against NOW in the SNAPSHOT below, always as " +
  'ISO 8601 with the +08:00 offset. Never include "action" for anything that isn\'t explicitly asking you to add/schedule/create ' +
  "something. Then a newline, then your reply — written as if it's already done (it will be by the time you're read). " +
  "Nothing else before the JSON line.";

type CreateEventAction = { type: "create_event"; title: string; start: string; end: string; location?: string };
type CreateAssignmentAction = { type: "create_assignment"; course: string; title: string; dueAt: string };
type Action = CreateEventAction | CreateAssignmentAction;

// Pulls the leading {"topic":..., "action":...} line back out of a tagged
// reply. Used server-side for the (non-streaming) digest and to detect
// create_event/create_assignment requests; the streaming query reply is
// tagged the same way but its topic is parsed client-side too, as tokens arrive.
function parseTag(raw: string): { topic: Topic; action: Action | null; body: string } {
  const nl = raw.indexOf("\n");
  const tagLine = nl === -1 ? raw : raw.slice(0, nl);
  const body = nl === -1 ? "" : raw.slice(nl + 1).trim();

  const topicMatch = tagLine.match(/"topic"\s*:\s*"(\w+)"/);
  const topic = (topicMatch && (TOPICS as readonly string[]).includes(topicMatch[1]) ? topicMatch[1] : "schedule") as Topic;

  let action: Action | null = null;
  try {
    const parsed = JSON.parse(tagLine);
    const a = parsed?.action;
    if (a?.type === "create_event" && a.title && a.start && a.end) {
      action = a;
    } else if (a?.type === "create_assignment" && a.course && a.title && a.dueAt) {
      action = a;
    }
  } catch {
    // tagLine wasn't (yet, or ever) valid standalone JSON — no action, that's fine
  }

  return { topic, action, body };
}

async function runAction(action: Action) {
  if (action.type === "create_event") return createCalendarEvent(action);
  return createAssignment(action);
}

// GET returns the cached daily digest for the sidebar to show on load —
// never calls the model itself.
export async function GET(req: NextRequest) {
  if (!(await isAuthedCookie(req.cookies.get(AUTH_COOKIE)?.value))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const digest = await prisma.companionDigest.findUnique({ where: { id: 1 } });
  return Response.json({ text: digest?.text ?? null, topic: digest?.topic ?? "schedule", createdAt: digest?.createdAt ?? null });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mode = body.mode === "digest" ? "digest" : "query";

  if (mode === "digest") {
    // Fired once a day by GitHub Actions (see .github/workflows/companion-digest.yml).
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      const snapshot = await getUserSnapshot();
      const message = await anthropic.messages.create({
        model: DIGEST_MODEL,
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `SNAPSHOT:\n${formatSnapshot(snapshot)}\n\nGive one short proactive observation — the single most urgent or notable thing (a deadline, exam, or spending pace). No preamble.`,
          },
        ],
      });
      const raw = message.content.find((b) => b.type === "text")?.text ?? "";
      const { topic, body: text } = parseTag(raw); // digest is non-interactive — any "action" is ignored
      const digest = await prisma.companionDigest.upsert({
        where: { id: 1 },
        update: { text, topic },
        create: { id: 1, text, topic },
      });
      return Response.json({ text: digest.text, topic: digest.topic, createdAt: digest.createdAt });
    } catch (err) {
      console.error("Companion digest failed:", err);
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ error: message }, { status: 500 });
    }
  }

  if (!(await isAuthedCookie(req.cookies.get(AUTH_COOKIE)?.value))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const question = typeof body.message === "string" ? body.message.trim() : "";
  if (!question) return Response.json({ error: "message required" }, { status: 400 });

  const snapshot = await getUserSnapshot();
  const messageStream = anthropic.messages.stream({
    model: QUERY_MODEL,
    max_tokens: 500,
    system: `${SYSTEM_PROMPT}\n\nSNAPSHOT:\n${formatSnapshot(snapshot)}`,
    messages: [{ role: "user", content: question }],
  });

  // Raw text (topic-tag line included) is streamed through as-is — the
  // client parses the tag out of the first line as tokens arrive. The one
  // exception is an action reply (create_event/create_assignment): we
  // can't let the model's "done!" text reach the client until the write
  // has actually been attempted, so that specific case is buffered in
  // full instead of streamed token-by-token.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // "end" fires even after "error" (e.g. an auth failure before any
      // token arrives) — a controller can only be closed/errored once.
      let settled = false;
      const close = () => {
        if (settled) return;
        settled = true;
        controller.close();
      };
      const fail = (err: unknown) => {
        if (settled) return;
        settled = true;
        controller.error(err);
      };

      let raw = "";
      let tagSeen = false;
      let action: Action | null = null;
      let live = false; // once true, chunks are forwarded as they arrive

      messageStream.on("text", (text) => {
        raw += text;
        if (!tagSeen) {
          const nl = raw.indexOf("\n");
          if (nl === -1) return; // still buffering the tag line
          tagSeen = true;
          action = parseTag(raw).action;
          if (!action) {
            controller.enqueue(encoder.encode(raw)); // flush the tag line (+ anything already after it)
            live = true;
          }
          // an action reply stays buffered — see the "end" handler below
          return;
        }
        if (live) controller.enqueue(encoder.encode(text));
      });

      messageStream.on("end", async () => {
        if (settled || live) {
          close();
          return;
        }
        if (!action) {
          // never found a newline at all (short reply, no body) — just send it
          controller.enqueue(encoder.encode(raw));
          close();
          return;
        }
        try {
          await runAction(action);
          controller.enqueue(encoder.encode(raw)); // the model's own confirmation text
        } catch {
          const { topic } = parseTag(raw);
          const where = action.type === "create_event" ? "your calendar" : "the assignments list";
          controller.enqueue(encoder.encode(`{"topic":"${topic}"}\ncouldn't reach ${where} just now — mind trying again in a bit?`));
        }
        close();
      });

      messageStream.on("error", (err) => fail(err));
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
