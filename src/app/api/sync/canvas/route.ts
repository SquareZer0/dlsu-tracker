import { NextResponse } from "next/server";
import * as ical from "node-ical";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

// Runs server-side, so there's no CORS wall here the way there was when the
// browser tried to fetch Canvas directly in the design mockup.
export async function POST() {
  const url = process.env.CANVAS_ICS_URL;
  if (!url) return NextResponse.json({ error: "CANVAS_ICS_URL not set" }, { status: 400 });

  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: `canvas fetch failed: ${res.status}` }, { status: 502 });
  const text = await res.text();
  const data = ical.parseICS(text);

  let assignments = 0;
  let exams = 0;
  let skipped = 0;

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

    if (isExam) {
      await prisma.exam.upsert({
        where: { externalId: ev.uid },
        update: { title, course, dueAt: ev.start },
        create: { externalId: ev.uid, title, course, dueAt: ev.start },
      });
      exams++;
    } else {
      await prisma.assignment.upsert({
        where: { externalId: ev.uid },
        update: { title, course, dueAt: ev.start },
        create: { externalId: ev.uid, title, course, dueAt: ev.start },
      });
      assignments++;
    }
  }

  return NextResponse.json({ assignments, exams, skipped });
}

