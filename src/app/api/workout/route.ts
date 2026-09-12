import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentWeekStart } from "@/lib/theme";

export const dynamic = "force-dynamic";

// A row's presence means checked — nothing marks "unchecked" — and
// weekStart scopes rows to the current week, so once Monday rolls
// around last week's rows simply stop matching.
export async function GET() {
  const weekStart = currentWeekStart(new Date());
  const checks = await prisma.workoutCheck.findMany({ where: { weekStart } });
  return NextResponse.json({ weekStart, checked: checks.map((c) => `${c.day}:${c.exercise}`) });
}

export async function POST(req: NextRequest) {
  const { day, exercise, checked } = await req.json();
  if (typeof day !== "string" || typeof exercise !== "string" || typeof checked !== "boolean") {
    return NextResponse.json({ error: "day, exercise, and checked required" }, { status: 400 });
  }
  const weekStart = currentWeekStart(new Date());

  if (checked) {
    await prisma.workoutCheck.upsert({
      where: { day_exercise_weekStart: { day, exercise, weekStart } },
      update: {},
      create: { day, exercise, weekStart },
    });
  } else {
    await prisma.workoutCheck.deleteMany({ where: { day, exercise, weekStart } });
  }

  return NextResponse.json({ ok: true });
}
