import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const assignments = await prisma.assignment.findMany({
    where: { OR: [{ done: false }, { done: true, doneAt: { gte: cutoff } }] },
    orderBy: { dueAt: "asc" },
  });
  return NextResponse.json(assignments);
}

export async function PATCH(req: NextRequest) {
  const { id, done } = await req.json();
  const updated = await prisma.assignment.update({
    where: { id },
    data: { done, doneAt: done ? new Date() : null },
  });
  return NextResponse.json(updated);
}
