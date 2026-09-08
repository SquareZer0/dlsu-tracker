import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const blocks = await prisma.classBlock.findMany({ orderBy: [{ weekday: "asc" }, { startMin: "asc" }] });
  return NextResponse.json(blocks);
}
