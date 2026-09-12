import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// The per-run dedupe in /api/sync/canvas only catches duplicate lab-section
// events seen within the same sync — it can't undo duplicates already sitting
// in the database (stale prisma/seed.ts demo rows, or titles that differ by
// more than whitespace). GitHub Actions hits this on a schedule (see
// .github/workflows/dedupe.yml) with a bearer secret, same as /api/cron/notify.
function normalize(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Real Canvas syncs always set externalId to the feed's iCal UID
// ("event-assignment-...", "event-calendar-event-...", etc). Anything else —
// e.g. prisma/seed.ts's demo rows, which use the literal title as
// externalId — is stale placeholder data and should never be kept over a
// genuine synced duplicate, even if it happens to have a lower id.
function isCanvasOrigin(externalId: string | null) {
  return !!externalId && externalId.startsWith("event-");
}

async function dedupe<T extends { id: number; course: string; title: string; externalId: string | null; canvasUrl: string | null }>(
  rows: T[],
  update: (id: number, canvasUrl: string) => Promise<unknown>,
  del: (ids: number[]) => Promise<unknown>,
) {
  const groups = new Map<string, T[]>();
  for (const r of rows) {
    const key = `${r.course}|${normalize(r.title)}`;
    const group = groups.get(key);
    if (group) group.push(r); else groups.set(key, [r]);
  }

  const toDelete: number[] = [];

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => {
      const rank = (r: T) => (isCanvasOrigin(r.externalId) ? 0 : 1);
      return rank(a) - rank(b) || a.id - b.id;
    });
    const [keep, ...rest] = group;
    let canvasUrl = keep.canvasUrl;
    for (const r of rest) {
      if (!canvasUrl && r.canvasUrl) canvasUrl = r.canvasUrl;
      toDelete.push(r.id);
    }
    if (canvasUrl && canvasUrl !== keep.canvasUrl) await update(keep.id, canvasUrl);
  }

  if (toDelete.length > 0) await del(toDelete);
  return toDelete;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const assignments = await prisma.assignment.findMany({ orderBy: { id: "asc" } });
    const deletedAssignments = await dedupe(
      assignments,
      (id, canvasUrl) => prisma.assignment.update({ where: { id }, data: { canvasUrl } }),
      (ids) => prisma.assignment.deleteMany({ where: { id: { in: ids } } }),
    );

    const exams = await prisma.exam.findMany({ orderBy: { id: "asc" } });
    const deletedExams = await dedupe(
      exams,
      (id, canvasUrl) => prisma.exam.update({ where: { id }, data: { canvasUrl } }),
      (ids) => prisma.exam.deleteMany({ where: { id: { in: ids } } }),
    );

    return NextResponse.json({ deletedAssignments, deletedExams });
  } catch (err) {
    console.error("Dedupe failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
