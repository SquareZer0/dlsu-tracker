import { prisma } from "@/lib/prisma";
import { getGCalData, type GCalEvent } from "@/lib/gcal";

// Aggregates the data the companion needs to talk about the student's
// actual situation. No GWA/grades model exists in the schema yet, so
// that's omitted until one does.
export async function getUserSnapshot() {
  const [settings, recentTransactions, pendingAssignments, upcomingExams, gcal] = await Promise.all([
    prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.assignment.findMany({ where: { done: false }, orderBy: { dueAt: "asc" }, take: 8 }),
    prisma.exam.findMany({ orderBy: { dueAt: "asc" }, take: 5 }),
    getGCalData(new Date()),
  ]);

  return {
    balance: settings.balance,
    recentTransactions,
    pendingAssignments,
    upcomingExams,
    todayEvents: gcal.today,
    tomorrowEvents: gcal.tomorrow,
  };
}

export type UserSnapshot = Awaited<ReturnType<typeof getUserSnapshot>>;

function formatEvent(ev: GCalEvent): string {
  const when = ev.isAllDay ? "all day" : ev.startTime;
  return ev.location ? `${ev.title} at ${when} (${ev.location})` : `${ev.title} at ${when}`;
}

// Compact plain-text form for the system prompt — cheaper and more
// steerable than handing the model raw JSON.
export function formatSnapshot(s: UserSnapshot): string {
  const now = Date.now();
  const days = (d: Date) => Math.round((new Date(d).getTime() - now) / 86400000);

  // ISO with the +08:00 offset spelled out, since the model has no innate
  // sense of "now" and needs a concrete anchor to resolve things like
  // "tomorrow at 3pm" into a real calendar-event timestamp.
  const nowManila = new Date(now).toLocaleString("sv-SE", { timeZone: "Asia/Manila" }).replace(" ", "T") + "+08:00";
  const lines = [`NOW: ${nowManila}`, `BALANCE: PHP ${s.balance.toFixed(2)}`];

  lines.push(
    s.recentTransactions.length
      ? `RECENT TRANSACTIONS: ${s.recentTransactions.map((t) => `${t.label} ${t.amount >= 0 ? "+" : ""}${t.amount.toFixed(2)}`).join("; ")}`
      : "RECENT TRANSACTIONS: none"
  );

  lines.push(
    s.pendingAssignments.length
      ? `PENDING ASSIGNMENTS: ${s.pendingAssignments.map((a) => `${a.course} "${a.title}" due in ${days(a.dueAt)}d`).join("; ")}`
      : "PENDING ASSIGNMENTS: none"
  );

  lines.push(
    s.upcomingExams.length
      ? `UPCOMING EXAMS: ${s.upcomingExams.map((e) => `${e.course} "${e.title}" in ${days(e.dueAt)}d`).join("; ")}`
      : "UPCOMING EXAMS: none"
  );

  lines.push(
    s.todayEvents.length
      ? `TODAY'S SCHEDULE: ${s.todayEvents.map(formatEvent).join("; ")}`
      : "TODAY'S SCHEDULE: nothing on the calendar"
  );

  lines.push(
    s.tomorrowEvents.length
      ? `TOMORROW'S SCHEDULE: ${s.tomorrowEvents.map(formatEvent).join("; ")}`
      : "TOMORROW'S SCHEDULE: nothing on the calendar"
  );

  return lines.join("\n");
}
