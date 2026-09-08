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
  return title.replace(/\s+/g, "").toLowerCase();
}

async function main() {
  const res = await client.execute(`SELECT id, course, title, canvasUrl FROM "Assignment" ORDER BY id ASC`);
  const rows = res.rows as unknown as { id: number; course: string; title: string; canvasUrl: string | null }[];

  const keepByKey = new Map<string, { id: number; canvasUrl: string | null }>();
  const toDelete: number[] = [];

  for (const r of rows) {
    const key = `${r.course}|${normalize(r.title)}`;
    const kept = keepByKey.get(key);
    if (!kept) {
      keepByKey.set(key, { id: r.id, canvasUrl: r.canvasUrl });
      continue;
    }
    toDelete.push(r.id);
    if (!kept.canvasUrl && r.canvasUrl) {
      await client.execute({
        sql: `UPDATE "Assignment" SET "canvasUrl" = ? WHERE id = ?`,
        args: [r.canvasUrl, kept.id],
      });
      kept.canvasUrl = r.canvasUrl;
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
