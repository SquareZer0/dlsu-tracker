import { NextResponse } from "next/server";
import { getGCalData } from "@/lib/gcal";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getGCalData(new Date());
  return NextResponse.json(data);
}
