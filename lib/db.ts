import { PrismaClient } from "@prisma/client";

// Dev hot-reload re-evaluates this module, so the client is kept on globalThis
// to reuse one connection pool instead of opening a new one on every reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
