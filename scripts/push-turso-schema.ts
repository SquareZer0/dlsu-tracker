// Prisma's own `db push`/`migrate` commands only accept file: URLs for the
// sqlite provider — they don't understand libsql:// at all, even though the
// app's runtime does (via the driver adapter). So this creates the tables
// directly over the same @libsql/client the app already uses, sidestepping
// Prisma's CLI for this one step. Run once against a fresh Turso database.
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) first.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const statements = [
  `CREATE TABLE IF NOT EXISTS "Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "course" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "dueAt" DATETIME NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Assignment_externalId_key" ON "Assignment"("externalId")`,
  `CREATE TABLE IF NOT EXISTS "Exam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "course" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Exam_externalId_key" ON "Exam"("externalId")`,
  `CREATE TABLE IF NOT EXISTS "ClassBlock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "course" TEXT NOT NULL,
    "room" TEXT,
    "weekday" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "balance" REAL NOT NULL DEFAULT 3500,
    "canvasUrl" TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS "NotifyLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "NotifyLog_key_key" ON "NotifyLog"("key")`,
];

async function main() {
  for (const sql of statements) {
    await client.execute(sql);
  }
  // ALTER TABLE ADD COLUMN for a table that may already exist from an earlier
  // run — SQLite has no "ADD COLUMN IF NOT EXISTS", so we just ignore the
  // "duplicate column" error if it's already there.
  try {
    await client.execute(`ALTER TABLE "Assignment" ADD COLUMN "doneAt" DATETIME`);
    console.log('Added "doneAt" column to Assignment.');
  } catch (e: any) {
    if (!String(e?.message ?? e).includes("duplicate column")) throw e;
    console.log('"doneAt" column already exists on Assignment — skipped.');
  }
  try {
    await client.execute(`ALTER TABLE "Settings" ADD COLUMN "spotifyRefreshToken" TEXT`);
    console.log('Added "spotifyRefreshToken" column to Settings.');
  } catch (e: any) {
    if (!String(e?.message ?? e).includes("duplicate column")) throw e;
    console.log('"spotifyRefreshToken" column already exists on Settings — skipped.');
  }
  console.log(`Created/verified ${statements.length} tables/indexes on Turso.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
