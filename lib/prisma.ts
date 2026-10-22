import { PrismaClient } from "@prisma/client";

/**
 * En desarrollo Next recarga los módulos en caliente; sin este caché cada
 * recarga abriría una conexión nueva hasta agotar el pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
