import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNtfy } from "@/lib/ntfy";
import { dayDiff, clock } from "@/lib/theme";

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
  for (const item of [...assignments, ...exams]) {
    const days = dayDiff(item.dueAt, now);
    if (days >= 2 && days <= 3) {
      const key = `due-${"course" in item ? "x" : ""}${item.id}-${item.dueAt.toISOString().slice(0, 10)}`;
      if (!(await already(key))) {
        await sendNtfy(`${item.course}: ${item.title}`, `Due in ${days} days`);
        await markSent(key);
        sent.push(key);
      }
    }
  }

  const weekday = now.getDay();
  const blocks = await prisma.classBlock.findMany({ where: { weekday } });
  for (const b of blocks) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setMinutes(b.startMin);
    const minsUntil = (start.getTime() - now.getTime()) / 60000;
    if (minsUntil >= 0 && minsUntil <= 15) {
      const key = `class-${b.id}-${now.toDateString()}`;
      if (!(await already(key))) {
        await sendNtfy("Class starting soon", `${b.course}${b.room ? " · " + b.room : ""} at ${clock(start)}`);
        await markSent(key);
        sent.push(key);
      }
    }
  }

  return NextResponse.json({ sent });
}
