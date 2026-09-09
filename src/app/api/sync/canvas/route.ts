import { NextResponse } from "next/server";
import { syncCanvas } from "@/lib/canvasSync";

export const dynamic = "force-dynamic";

// Runs server-side, so there's no CORS wall here the way there was when the
// browser tried to fetch Canvas directly in the design mockup.
export async function POST() {
  try {
    const result = await syncCanvas();
    return NextResponse.json(result);
  } catch (e: any) {
    const message = String(e?.message ?? e);
    return NextResponse.json({ error: message }, { status: message.includes("not set") ? 400 : 502 });
  }
}
