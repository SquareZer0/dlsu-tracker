import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNtfy } from "@/lib/ntfy";
import { dayDiff, clock, manilaParts } from "@/lib/theme";

export const dynamic = "force-dynamic";

// GitHub Actions hits this on a schedule (see .github/workflows/notify.yml)
// with a bearer secret, since Vercel's free-tier cron only fires once a day.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sent: string[] = [];

  const already = async (key: string) => !!(await prisma.notifyLog.findUnique({ where: { key } }));
  const markSent = (key: string) => prisma.notifyLog.create({ data: { key } });

  const assignments = await prisma.assignment.findMany({ where: { done: false } });
  const exams = await prisma.exam.findMany();
  // Assignment and Exam ids overlap, so the key has to say which table it's from.
  const due = [
    ...assignments.map((item) => ({ kind: "a", item })),
    ...exams.map((item) => ({ kind: "x", item })),
  ];
  for (const { kind, item } of due) {
    const days = dayDiff(item.dueAt, now);
    if (days >= 2 && days <= 3) {
      const key = `due-${kind}${item.id}-${item.dueAt.toISOString().slice(0, 10)}`;
      if (!(await already(key))) {
        await sendNtfy(`${item.course}: ${item.title}`, `Due in ${days} days`);
        await markSent(key);
        sent.push(key);
      }
    }
  }

  // Class blocks are stored as Manila weekday + minutes-past-midnight, but
  // this runs on Vercel in UTC — compare against Manila wall-clock time.
  const { weekday, minutes } = manilaParts(now);
  const blocks = await prisma.classBlock.findMany({ where: { weekday } });
  for (const b of blocks) {
    const minsUntil = b.startMin - minutes;
    const start = new Date(now.getTime() + minsUntil * 60000);
    if (minsUntil >= 0 && minsUntil <= 15) {
      const key = `class-${b.id}-${start.toISOString().slice(0, 10)}`;
      if (!(await already(key))) {
        await sendNtfy("Class starting soon", `${b.course}${b.room ? " · " + b.room : ""} at ${clock(start)}`);
        await markSent(key);
        sent.push(key);
      }
    }
  }

  return NextResponse.json({ sent });
}
