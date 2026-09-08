import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// IMPORTANT: this path is intentionally NOT read from DATABASE_URL.
// Prisma's CLI (db push / db seed) resolves a relative sqlite "file:" path
// relative to prisma/schema.prisma, so "file:./dev.db" in .env actually
// creates prisma/dev.db on disk. This client, though, runs via `next dev`/
// `next start` from the project root, and @libsql/client resolves relative
// paths against the current working directory — so it has to point at
// "./prisma/dev.db" explicitly to open the same file the CLI created.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function buildClient() {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db";
  const libsql = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  const adapter = new PrismaLibSQL(libsql);
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const prisma = global.prisma ?? buildClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;
