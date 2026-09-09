import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, isAuthedCookie } from "@/lib/auth";
import { getUserSnapshot, formatSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic();

// Both modes read claude-sonnet-5 here — swap QUERY_MODEL to
// "claude-haiku-4-5-20251001" if interactive replies feel slow.
const DIGEST_MODEL = "claude-sonnet-5";
const QUERY_MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT =
  "You are a terse terminal companion embedded in a student's dashboard app. " +
  "Reply in 1-3 short sentences, plain text only — no markdown, no bullet points, no headers, no greetings or sign-offs. " +
  "Sound like a dry terminal readout, not a chatbot. Use the SNAPSHOT data below when it's relevant to what's asked, " +
  "and never invent numbers or deadlines that aren't in it.";

// GET returns the cached daily digest for the sidebar to show on load —
// never calls the model itself.
export async function GET(req: NextRequest) {
  if (!(await isAuthedCookie(req.cookies.get(AUTH_COOKIE)?.value))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const digest = await prisma.companionDigest.findUnique({ where: { id: 1 } });
  return Response.json({ text: digest?.text ?? null, createdAt: digest?.createdAt ?? null });
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
    const text = message.content.find((b) => b.type === "text")?.text ?? "";
    const digest = await prisma.companionDigest.upsert({
      where: { id: 1 },
      update: { text },
      create: { id: 1, text },
    });
    return Response.json({ text: digest.text, createdAt: digest.createdAt });
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // "end" fires even after "error" (e.g. an auth failure before any
      // token arrives) — a controller can only be closed/errored once.
      let settled = false;
      messageStream.on("text", (text) => controller.enqueue(encoder.encode(text)));
      messageStream.on("end", () => {
        if (settled) return;
        settled = true;
        controller.close();
      });
      messageStream.on("error", (err) => {
        if (settled) return;
        settled = true;
        controller.error(err);
      });
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
