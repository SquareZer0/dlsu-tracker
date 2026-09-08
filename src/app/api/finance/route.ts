import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: 1 }, update: {}, create: { id: 1 },
  });
  const transactions = await prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ balance: settings.balance, transactions });
}

export async function POST(req: NextRequest) {
  const { label, amount } = await req.json();
  if (!label || typeof amount !== "number") {
    return NextResponse.json({ error: "label and numeric amount required" }, { status: 400 });
  }
  const tx = await prisma.transaction.create({ data: { label, amount } });
  const settings = await prisma.settings.upsert({
    where: { id: 1 }, update: { balance: { increment: amount } }, create: { id: 1, balance: 3500 + amount },
  });
  return NextResponse.json({ transaction: tx, balance: settings.balance });
}
