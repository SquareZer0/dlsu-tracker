// One-time cleanup for assignments duplicated by DLSU's Canvas feed including
// every lab section's calendar (see the normalize/seenNormKeys dedupe added
// to src/app/api/sync/canvas/route.ts, which prevents new duplicates but
// doesn't touch rows already created by past syncs). Safe to run more than
// once — it just won't find anything left to delete the second time.
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });

function normalize(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Real Canvas syncs always set externalId to the feed's iCal UID
// ("event-assignment-...", "event-calendar-event-...", etc). Anything else —
// e.g. prisma/seed.ts's demo rows, which use the literal title as
// externalId — is stale placeholder data, so it should never be kept over a
// genuine synced duplicate even if it happens to have a lower id.
function isCanvasOrigin(externalId: string | null) {
  return !!externalId && externalId.startsWith("event-");
}

type Row = { id: number; course: string; title: string; canvasUrl: string | null; externalId: string | null };

async function main() {
  const res = await client.execute(`SELECT id, course, title, canvasUrl, externalId FROM "Assignment" ORDER BY id ASC`);
  const rows = res.rows as unknown as Row[];

  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = `${r.course}|${normalize(r.title)}`;
    const group = groups.get(key);
    if (group) group.push(r); else groups.set(key, [r]);
  }

  const toDelete: number[] = [];

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => {
      const rank = (r: Row) => (isCanvasOrigin(r.externalId) ? 0 : 1);
      return rank(a) - rank(b) || a.id - b.id;
    });
    const [keep, ...rest] = group;
    let canvasUrl = keep.canvasUrl;
    for (const r of rest) {
      if (!canvasUrl && r.canvasUrl) canvasUrl = r.canvasUrl;
      toDelete.push(r.id);
    }
    if (canvasUrl !== keep.canvasUrl) {
      await client.execute({ sql: `UPDATE "Assignment" SET "canvasUrl" = ? WHERE id = ?`, args: [canvasUrl, keep.id] });
    }
  }

  if (toDelete.length === 0) {
    console.log("No duplicate rows found.");
    return;
  }

  await client.execute(`DELETE FROM "Assignment" WHERE id IN (${toDelete.join(",")})`);
  console.log(`Deleted ${toDelete.length} duplicate assignment row(s): ${toDelete.join(", ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
