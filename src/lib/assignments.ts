// Shared with api/assignments/route.ts's POST handler (the manual "+" form)
// so the companion's create_assignment action doesn't duplicate the logic.
import { prisma } from "@/lib/prisma";

export type NewAssignment = { course: string; title: string; dueAt: string };

export async function createAssignment({ course, title, dueAt }: NewAssignment) {
  if (!course?.trim() || !title?.trim() || !dueAt) {
    throw new Error("course, title, and dueAt are required");
  }
  return prisma.assignment.create({
    data: { course: course.trim(), title: title.trim(), dueAt: new Date(dueAt) },
  });
}
