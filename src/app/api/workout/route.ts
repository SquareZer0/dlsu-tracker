import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROUTINE, nextWorkoutAvailableAt, type WorkoutDay } from "@/lib/workout";

export const dynamic = "force-dynamic";

function otherDay(day: WorkoutDay): WorkoutDay {
  return day === "A" ? "B" : "A";
}

// Flips to the other workout once a completed day's cooldown has elapsed,
// clearing that day's checks for a fresh start — resolved lazily on every
// request instead of via a cron job.
async function resolveState() {
  let state = await prisma.workoutState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  if (state.cooldownUntil && state.cooldownUntil.getTime() <= Date.now()) {
    const nextDay = otherDay(state.activeDay as WorkoutDay);
    await prisma.workoutSessionCheck.deleteMany({ where: { day: nextDay } });
    state = await prisma.workoutState.update({
      where: { id: 1 },
      data: { activeDay: nextDay, cooldownStartedAt: null, cooldownUntil: null },
    });
  }
  return state;
}

async function currentPayload() {
  const state = await resolveState();
  const inCooldown = !!state.cooldownUntil;
  const day = state.activeDay as WorkoutDay;
  const checks = await prisma.workoutSessionCheck.findMany({ where: { day } });
  return {
    activeDay: day,
    inCooldown,
    cooldownStartedAt: state.cooldownStartedAt,
    cooldownUntil: state.cooldownUntil,
    checked: checks.map((c) => c.exercise),
  };
}

export async function GET() {
  return NextResponse.json(await currentPayload());
}

// "Skip" on the cooldown overlay: ending the cooldown now lets resolveState()
// do the usual flip to the other day, same as if the timer had run out.
export async function PATCH(req: NextRequest) {
  const { skipCooldown } = await req.json();
  if (skipCooldown !== true) {
    return NextResponse.json({ error: "skipCooldown required" }, { status: 400 });
  }
  await prisma.workoutState.updateMany({
    where: { id: 1, cooldownUntil: { not: null } },
    data: { cooldownUntil: new Date() },
  });
  return NextResponse.json(await currentPayload());
}

export async function POST(req: NextRequest) {
  const { exercise, checked } = await req.json();
  if (typeof exercise !== "string" || typeof checked !== "boolean") {
    return NextResponse.json({ error: "exercise and checked required" }, { status: 400 });
  }
  const state = await resolveState();
  if (state.cooldownUntil) {
    return NextResponse.json({ error: "in cooldown" }, { status: 400 });
  }
  const day = state.activeDay as WorkoutDay;

  if (checked) {
    await prisma.workoutSessionCheck.upsert({
      where: { day_exercise: { day, exercise } },
      update: {},
      create: { day, exercise },
    });
  } else {
    await prisma.workoutSessionCheck.deleteMany({ where: { day, exercise } });
  }

  const checks = await prisma.workoutSessionCheck.findMany({ where: { day } });
  const allDone = ROUTINE[day].exercises.every((ex) => checks.some((c) => c.exercise === ex.slug));

  let cooldownStartedAt: Date | null = null;
  let cooldownUntil: Date | null = null;
  if (allDone) {
    cooldownStartedAt = new Date();
    cooldownUntil = nextWorkoutAvailableAt(cooldownStartedAt);
    await prisma.workoutState.update({ where: { id: 1 }, data: { cooldownStartedAt, cooldownUntil } });
  }

  return NextResponse.json({
    activeDay: day,
    inCooldown: allDone,
    cooldownStartedAt,
    cooldownUntil,
    checked: checks.map((c) => c.exercise),
  });
}
