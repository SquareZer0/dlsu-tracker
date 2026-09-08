// Warm, casual, name-checked greetings — deliberately not in the terse
// all-caps HUD style used elsewhere, so it reads as a human touch against
// the rest of the interface rather than another status line.
export type Period = "morning" | "afternoon" | "evening" | "night";

const pools: Record<Period, string[]> = {
  morning: [
    "Good morning, Miguel.",
    "Morning, Miguel — let's get into it.",
    "Rise and shine, Miguel.",
    "Morning. Coffee first, then the list.",
    "Hey Miguel, hope you slept well.",
    "Another day, another term week.",
  ],
  afternoon: [
    "Good afternoon, Miguel.",
    "Hope your day's going smoothly, Miguel.",
    "Halfway through the day, Miguel.",
    "Afternoon check-in, Miguel.",
    "Keep going, Miguel — you've got this.",
    "Hey Miguel, how's the day treating you?",
  ],
  evening: [
    "Good evening, Miguel.",
    "Evening, Miguel — almost done for today.",
    "Winding down, Miguel?",
    "Hey Miguel, hope today went well.",
    "Evening check-in, Miguel.",
    "Nice work today, Miguel.",
  ],
  night: [
    "Still up, Miguel?",
    "Burning the midnight oil, Miguel.",
    "Late one tonight, Miguel.",
    "Hey Miguel, don't stay up too late.",
    "Quiet hours, Miguel.",
    "Working late, Miguel? Take a break soon.",
  ],
};

function periodFor(hour: number): Period {
  if (hour < 5) return "night";
  if (hour < 11) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

// Picked once per mount (page load/refresh), not on every clock tick.
// Returns the period alongside the text so a matching icon can be picked
// from the same moment, rather than recomputing time-of-day separately.
export function pickGreeting(now: Date = new Date()): { text: string; period: Period } {
  const period = periodFor(now.getHours());
  const pool = pools[period];
  return { text: pool[Math.floor(Math.random() * pool.length)], period };
}
