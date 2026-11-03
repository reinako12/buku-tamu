import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Satu instance PrismaClient per proses.
 *
 * Di dev, Next.js me-reload module tiap kali file berubah. Tanpa cache di
 * globalThis, tiap reload bikin koneksi baru sampai pool Postgres penuh.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
