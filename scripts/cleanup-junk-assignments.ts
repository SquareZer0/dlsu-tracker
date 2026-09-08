// One-time cleanup for class-session reminders that got imported as
// assignments before the sync logic filtered them out. Safe to run more than
// once — it just won't find anything left to delete the second time.
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });

function isNonAssignmentNotice(course: string, title: string) {
  const escaped = course.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const isBareCourseSession = new RegExp(`^${escaped}\\s*(\\(.*\\))?$`, "i").test(title.trim());
  const isReminderNotice = /\breminder\b/i.test(title);
  return isBareCourseSession || isReminderNotice;
}

async function main() {
  const res = await client.execute(`SELECT id, course, title FROM "Assignment"`);
  const rows = res.rows as unknown as { id: number; course: string; title: string }[];
  const junk = rows.filter((r) => isNonAssignmentNotice(r.course, r.title));

  if (junk.length === 0) {
    console.log("No junk rows found.");
    return;
  }

  await client.execute(`DELETE FROM "Assignment" WHERE id IN (${junk.map((r) => r.id).join(",")})`);
  console.log(`Deleted ${junk.length} non-assignment rows:`);
  for (const r of junk) console.log(`  [${r.course}] ${r.title}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
