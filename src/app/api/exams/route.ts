import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const exams = await prisma.exam.findMany({ orderBy: { dueAt: "asc" } });
  return NextResponse.json(exams);
}
