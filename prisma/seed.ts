import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Same adapter setup as src/lib/prisma.ts, duplicated here because this
// script runs standalone via tsx, outside Next.js's module resolution —
// same reasoning on the hardcoded path (see the comment in prisma.ts).
const libsql = createClient({ url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db", authToken: process.env.TURSO_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter: new PrismaLibSQL(libsql) } as ConstructorParameters<typeof PrismaClient>[0]);

const onDate = (y: number, mo: number, day: number, h = 23, m = 59) => new Date(y, mo - 1, day, h, m, 0);

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, balance: 3500, canvasUrl: process.env.CANVAS_ICS_URL ?? null },
  });

  const assignments = [
    { course: "STADVDB", title: "H01: Query Processing", note: "Investigate query execution plans and optimize before the group report is due.", dueAt: onDate(2026, 9, 21, 8, 0) },
    { course: "LCENWRD", title: "All About Me Project", note: "Personal narrative project — submit the completed write-up and materials.", dueAt: onDate(2026, 9, 22, 23, 59) },
    { course: "CSOPESY", title: "MO3: Marquee Console (Specification)", note: "Read the machine problem spec before starting implementation.", dueAt: onDate(2026, 9, 23, 23, 59) },
    { course: "LCLSONE", title: "Lasallian Journey Reflection", note: "Post a reflection on \"Lamp Posts and Shadows\" to the discussion thread.", dueAt: onDate(2026, 9, 28, 7, 30) },
    { course: "THS-ST2", title: "Request Thesis Panel Demo", note: "Email the panel to lock in a demo schedule — request only, no file to submit.", dueAt: onDate(2026, 11, 9, 23, 59) },
  ];
  for (const a of assignments) {
    await prisma.assignment.upsert({ where: { externalId: a.title }, update: {}, create: { ...a, externalId: a.title } });
  }

  const exams = [
    { course: "CSOPESY", title: "Midterm Exam", dueAt: onDate(2026, 10, 21, 23, 59) },
    { course: "CSOPESY", title: "Final Exam", dueAt: onDate(2026, 12, 7, 23, 59) },
  ];
  for (const e of exams) {
    await prisma.exam.upsert({ where: { externalId: e.title }, update: {}, create: { ...e, externalId: e.title } });
  }

  const blocks = [
    { weekday: 1, course: "CSOPESY", room: "G207", startMin: 11 * 60, endMin: 12 * 60 + 30 },
    { weekday: 1, course: "SPANONE (ONL)", room: "MM601", startMin: 14 * 60 + 30, endMin: 16 * 60 },
    { weekday: 2, course: "STADVDB", room: "", startMin: 11 * 60, endMin: 12 * 60 + 30 },
    { weekday: 2, course: "CCINOV8", room: "M316", startMin: 14 * 60 + 30, endMin: 16 * 60 },
    { weekday: 2, course: "LCENWRD", room: "L207", startMin: 16 * 60 + 15, endMin: 17 * 60 + 45 },
    { weekday: 3, course: "LCLSONE", room: "LS330", startMin: 10 * 60, endMin: 12 * 60 },
    { weekday: 4, course: "CSOPESY", room: "G207", startMin: 11 * 60, endMin: 12 * 60 + 30 },
    { weekday: 4, course: "SPANONE (F2F)", room: "MM601", startMin: 14 * 60 + 30, endMin: 16 * 60 },
    { weekday: 5, course: "STADVDB", room: "", startMin: 11 * 60, endMin: 12 * 60 + 30 },
    { weekday: 5, course: "CCINOV8", room: "M316", startMin: 14 * 60 + 30, endMin: 16 * 60 },
    { weekday: 5, course: "LCENWRD", room: "L207", startMin: 16 * 60 + 15, endMin: 17 * 60 + 45 },
  ];
  await prisma.classBlock.deleteMany();
  await prisma.classBlock.createMany({ data: blocks });

  console.log("Seeded assignments, exams, schedule, and settings.");
}

main().finally(() => prisma.$disconnect());
