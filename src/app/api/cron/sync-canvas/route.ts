import { NextRequest, NextResponse } from "next/server";
import { syncCanvas } from "@/lib/canvasSync";

export const dynamic = "force-dynamic";

// GitHub Actions hits this on a schedule (see .github/workflows/sync-canvas.yml)
// with a bearer secret — same pattern as /api/cron/notify — so assignments/exams
// stay current without needing someone to click "Sync Canvas" by hand.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncCanvas();
    return NextResponse.json(result);
  } catch (e: any) {
    const message = String(e?.message ?? e);
    return NextResponse.json({ error: message }, { status: message.includes("not set") ? 400 : 502 });
  }
}
