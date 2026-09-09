// Extracted from api/sync/canvas/route.ts so both the cookie-protected
// manual-button route and the bearer-protected cron route can share one
// implementation instead of duplicating the ICS parsing/upsert logic.
import * as ical from "node-ical";
import { prisma } from "@/lib/prisma";

// A real assignment title describes a task ("H01: Query Processing"). Canvas's
// calendar feed also includes things like recurring class-session/Zoom
// reminders, whose title is usually just the course code plus a section tag
// ("STADVDB (S03 & S04)") repeated once per week — those aren't deliverables,
// so they're filtered out here rather than imported as assignments.
function isNonAssignmentNotice(course: string, title: string) {
  const escaped = course.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const isBareCourseSession = new RegExp(`^${escaped}\\s*(\\(.*\\))?$`, "i").test(title.trim());
  const isReminderNotice = /\breminder\b/i.test(title);
  return isBareCourseSession || isReminderNotice;
}

// DLSU's Canvas feed includes every lab section's calendar, not just the one
// Miguel is enrolled in, so the same assignment shows up once per section
// with a near-identical title — sometimes only whitespace differs ("H01: ..."
// vs "H 01: ..."), sometimes punctuation too ("MO3: ..." vs "MO3 - ...").
// Those land as separate VEVENTs with different UIDs, so upserting on
// externalId alone doesn't catch them — dedupe within a run by comparing
// titles with all non-alphanumeric characters stripped instead.
function normalize(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Canvas's calendar `URL` property is just a generic "/calendar?..." link,
// not a deep link to the item, and every event description embeds decorative
// image links ("content-divider.png", "about.png", ...) via the WYSIWYG
// editor before the actual assignment/discussion/quiz link appears — a plain
// "first http(s) link" match grabs the divider image instead. Look for a
// link that's actually shaped like a Canvas course resource instead.
const CANVAS_RESOURCE_RE = /https?:\/\/[^\s")]+\/courses\/\d+\/(?:assignments|discussion_topics|quizzes|pages)\/[^\s")]+/;

function extractCanvasUrl(ev: any): string | null {
  const haystack = `${ev.url ?? ""} ${ev.description ?? ""}`;
  const match = CANVAS_RESOURCE_RE.exec(haystack);
  return match ? match[0] : null;
}

export async function syncCanvas() {
  const url = process.env.CANVAS_ICS_URL;
  if (!url) throw new Error("CANVAS_ICS_URL not set");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`canvas fetch failed: ${res.status}`);
  const text = await res.text();
  const data = ical.parseICS(text);

  let assignments = 0;
  let exams = 0;
  let skipped = 0;
  let duplicates = 0;
  const seenNormKeys = new Set<string>();

  for (const key in data) {
    const ev: any = data[key];
    if (ev.type !== "VEVENT" || !ev.start || !ev.summary) continue;

    const summary: string = ev.summary;
    const courseMatch = /\[([A-Z0-9_ ]+)\]\s*$/.exec(summary);
    const course = courseMatch ? courseMatch[1].split("_")[0] : "CANVAS";
    const title = summary.replace(/\s*\[[^\]]+\]\s*$/, "").trim();

    if (isNonAssignmentNotice(course, title)) {
      skipped++;
      continue;
    }

    const isExam = /\bexam\b/i.test(title);
    const normKey = `${isExam ? "exam" : "assignment"}|${course}|${normalize(title)}`;
    if (seenNormKeys.has(normKey)) {
      duplicates++;
      continue;
    }
    seenNormKeys.add(normKey);

    const canvasUrl = extractCanvasUrl(ev);

    if (isExam) {
      await prisma.exam.upsert({
        where: { externalId: ev.uid },
        update: { title, course, dueAt: ev.start, canvasUrl },
        create: { externalId: ev.uid, title, course, dueAt: ev.start, canvasUrl },
      });
      exams++;
    } else {
      await prisma.assignment.upsert({
        where: { externalId: ev.uid },
        update: { title, course, dueAt: ev.start, canvasUrl },
        create: { externalId: ev.uid, title, course, dueAt: ev.start, canvasUrl },
      });
      assignments++;
    }
  }

  return { assignments, exams, skipped, duplicates };
}
