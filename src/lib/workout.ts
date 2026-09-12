export type WorkoutDay = "A" | "B";

export type Exercise = { slug: string; name: string; detail: string };

const exercise = (name: string, detail: string): Exercise => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name,
  detail,
});

// Auto-alternating: finishing every exercise in a day starts a 24h cooldown,
// then the other day becomes active. Progression: hit the top of the rep
// range on all sets -> add weight next session.
export const COOLDOWN_MS = 24 * 60 * 60 * 1000;

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
