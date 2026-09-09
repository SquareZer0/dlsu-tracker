import { prisma } from "@/lib/prisma";

// Aggregates the data the companion needs to talk about the student's
// actual situation. No GWA/grades model exists in the schema yet, so
// that's omitted until one does.
export async function getUserSnapshot() {
  const [settings, recentTransactions, pendingAssignments, upcomingExams] = await Promise.all([
    prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.assignment.findMany({ where: { done: false }, orderBy: { dueAt: "asc" }, take: 8 }),
    prisma.exam.findMany({ orderBy: { dueAt: "asc" }, take: 5 }),
  ]);

  return { balance: settings.balance, recentTransactions, pendingAssignments, upcomingExams };
}

export type UserSnapshot = Awaited<ReturnType<typeof getUserSnapshot>>;

// Compact plain-text form for the system prompt — cheaper and more
// steerable than handing the model raw JSON.
export function formatSnapshot(s: UserSnapshot): string {
  const now = Date.now();
  const days = (d: Date) => Math.round((new Date(d).getTime() - now) / 86400000);

  const lines = [`BALANCE: PHP ${s.balance.toFixed(2)}`];

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

  return lines.join("\n");
}
