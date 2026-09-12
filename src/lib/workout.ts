export type WorkoutDay = "A" | "B" | "C";

export type Exercise = { slug: string; name: string; detail: string };

const exercise = (name: string, detail: string): Exercise => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name,
  detail,
});

export const ROUTINE: Record<WorkoutDay, { label: string; exercises: Exercise[] }> = {
  A: {
    label: "Push",
    exercises: [
      exercise("Chest press", "3×8-12 @ 20kg"),
      exercise("Incline press", "3×8-12 (upper chest angle)"),
      exercise("Shoulder press", "3×8-12 @ 15kg"),
      exercise("Lateral raises", "3×12-15 (side delts, presses miss this)"),
      exercise("Tricep press", "3×10-12 @ 20kg"),
    ],
  },
  B: {
    label: "Pull + arms",
    exercises: [
      exercise("Assisted pull-ups", "3×10 (keep as is)"),
      exercise("Pulldown", "3×8-12 @ 20kg"),
      exercise("Bicep curl", "3×8-12 @ 30kg"),
      exercise("Forearm curl", "3×10-12 @ 10kg"),
    ],
  },
  C: {
    label: "Legs + core",
    exercises: [
      exercise("Leg press", "3×8-12 @ 50kg"),
      exercise("Leg curl or leg extension", "3×10-12 (hamstrings/quads isolation)"),
      exercise("Abdominal crunches", "3×12-15 @ 20kg"),
      exercise("Hanging leg raise or plank", "3 sets (lower abs / anti-extension)"),
    ],
  },
};
