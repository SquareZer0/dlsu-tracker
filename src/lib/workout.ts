export type WorkoutDay = "A" | "B";

export type Exercise = { slug: string; name: string; detail: string };

const exercise = (name: string, detail: string): Exercise => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name,
  detail,
});

// Auto-alternating: finishing every exercise in a day starts a cooldown that
// lasts the rest of that calendar day plus the next full day — the other day
// becomes active at the start (00:00 Manila time) of the day after that, so
// a fixed one full rest day regardless of what time the workout finished
// (e.g. done Mon 6pm or Mon 6am, either way it's available again at the
// start of Wed). Progression: hit the top of the rep range on all sets ->
// add weight next session.
function toManilaDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export function nextWorkoutAvailableAt(completedAt: Date): Date {
  const todayKey = toManilaDateKey(completedAt);
  const target = new Date(`${todayKey}T00:00:00+08:00`);
  target.setUTCDate(target.getUTCDate() + 2);
  return target;
}

export const ROTATION_NOTE = "ROTATION: A ⇄ B, one day on, one day off";
export const PROGRESSION_NOTE = "PROGRESSION: top of rep range on all sets → add weight next session";

export const ROUTINE: Record<WorkoutDay, { label: string; exercises: Exercise[] }> = {
  A: {
    label: "Workout A",
    exercises: [
      exercise("Leg press", "3×8-12 @ 50kg"),
      exercise("Chest press", "3×8-12 @ 20kg"),
      exercise("Row", "3×8-12"),
      exercise("Lateral raises", "3×12-15"),
      exercise("Tricep press", "2×10-12 @ 20kg"),
      exercise("Bicep curl", "2×10-12 @ 30kg"),
      exercise("Crunches", "2×15"),
    ],
  },
  B: {
    label: "Workout B",
    exercises: [
      exercise("Leg curl or extension", "2×10-12"),
      exercise("Incline press", "3×8-12"),
      exercise("Pull-ups / pulldown", "3×8-12"),
      exercise("Calf raises", "2×12-15"),
      exercise("Shoulder press", "3×8-12 @ 15kg"),
      exercise("Forearm curl", "2×10-12 @ 10kg"),
      exercise("Side plank", "2×20-30 sec/side"),
      exercise("Russian twists", "2×15-20/side"),
    ],
  },
};
