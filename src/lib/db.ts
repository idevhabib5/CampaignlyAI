import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

/**
 * Vercel serverless has a read-only filesystem except /tmp.
 * Copy the seeded SQLite DB into /tmp on cold start so Prisma can open it.
 */
function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL;

  if (process.env.VERCEL) {
    const tmpDb = "/tmp/campaignly.db";
    const bundledDb = path.join(process.cwd(), "prisma", "dev.db");

    try {
      if (!fs.existsSync(tmpDb) && fs.existsSync(bundledDb)) {
        fs.copyFileSync(bundledDb, tmpDb);
      }
    } catch (error) {
      console.error("Failed to prepare SQLite database on Vercel:", error);
    }

    return `file:${tmpDb}`;
  }

  return configured || "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
