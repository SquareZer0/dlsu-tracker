export type WorkoutDay = "A" | "B" | "C";

export type Exercise = { slug: string; name: string; detail: string };

const exercise = (name: string, detail: string): Exercise => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name,
  detail,
});

// Rotation: A -> B -> C, 3-4x/week. Progression: hit the top of the rep
// range on all sets -> add weight next session.
export const ROTATION_NOTE = "ROTATION: A → B → C, 3-4x/week";
export const PROGRESSION_NOTE = "PROGRESSION: top of rep range on all sets → add weight next session";

export const ROUTINE: Record<WorkoutDay, { label: string; exercises: Exercise[] }> = {
  A: {
    label: "Push",
    exercises: [
      exercise("Chest press", "3×8-12 @ 20kg"),
      exercise("Incline press", "3×8-12"),
      exercise("Shoulder press", "3×8-12 @ 15kg"),
      exercise("Lateral raises", "3×12-15"),
      exercise("Tricep press", "3×10-12 @ 20kg"),
    ],
  },
  B: {
    label: "Pull + arms",
    exercises: [
      exercise("Assisted pull-ups", "3×10"),
      exercise("Pulldown", "3×8-12 @ 20kg"),
      exercise("Row (cable/dumbbell/chest-supported)", "3×8-12"),
      exercise("Bicep curl", "3×8-12 @ 30kg"),
      exercise("Forearm curl", "3×10-12 @ 10kg"),
    ],
  },
  C: {
    label: "Legs + core",
    exercises: [
      exercise("Leg press", "3×8-12 @ 50kg"),
      exercise("Leg curl or leg extension", "3×10-12"),
      exercise("Calf raises", "3×12-15"),
      exercise("Abdominal crunches", "3×12-15 @ 20kg"),
      exercise("Side plank", "3×20-30 sec/side"),
      exercise("Russian twists", "3×15-20/side"),
    ],
  },
};
