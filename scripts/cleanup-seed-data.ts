// One-time cleanup for prisma/seed.ts's demo assignments/exams, which got
// pushed to production at some point before Canvas syncing was wired up.
// Seed rows set externalId to the literal title text (see seed.ts) rather
// than a real Canvas iCal UID, so they're identifiable even when their
// wording doesn't match any currently-synced row closely enough for
// cleanup-duplicate-assignments.ts's normalized-title match to catch them.
// Safe to run more than once — it just won't find anything left to delete.
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });

async function purge(table: "Assignment" | "Exam") {
  const res = await client.execute(
    `SELECT id, course, title FROM "${table}" WHERE externalId NOT LIKE 'event-%' OR externalId IS NULL`,
  );
  const rows = res.rows as unknown as { id: number; course: string; title: string }[];
  if (rows.length === 0) {
    console.log(`No seed rows found in ${table}.`);
    return;
  }
  const ids = rows.map((r) => r.id);
  await client.execute(`DELETE FROM "${table}" WHERE id IN (${ids.join(",")})`);
  console.log(`Deleted ${rows.length} seed row(s) from ${table}:`);
  for (const r of rows) console.log(`  [${r.course}] ${r.title}`);
}

async function main() {
  await purge("Assignment");
  await purge("Exam");
}

main().catch((e) => { console.error(e); process.exit(1); });
