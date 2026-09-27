// Shared with api/assignments/route.ts's POST handler (the manual "+" form)
// so the companion's create_assignment action doesn't duplicate the logic.
import { prisma } from "@/lib/prisma";

export type NewAssignment = { course: string; title: string; dueAt: string };

export async function createAssignment({ course, title, dueAt }: NewAssignment) {
  if (!course?.trim() || !title?.trim() || !dueAt) {
    throw new Error("course, title, and dueAt are required");
  }
  // The companion sometimes omits the offset ("2026-09-12T23:59:00"), which
  // the server (UTC) would read as 8 hours late — treat bare times as Manila.
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(dueAt);
  const due = new Date(hasZone || !dueAt.includes("T") ? dueAt : `${dueAt}+08:00`);
  if (isNaN(due.getTime())) throw new Error(`invalid dueAt: ${dueAt}`);
  return prisma.assignment.create({
    data: { course: course.trim(), title: title.trim(), dueAt: due },
  });
}
