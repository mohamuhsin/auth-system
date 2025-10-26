// prisma/client.ts
import { PrismaClient } from "@prisma/client";

/**
 * 🧩 Prisma Client — Safe Singleton
 * ------------------------------------------------------------
 * Prevents multiple instances during hot reload (dev mode)
 * Logs detailed queries in dev, minimal logs in prod
 * Includes error safety on initialization
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

// 🧠 Optional: catch DB connection errors early
prisma
  .$connect()
  .then(() =>
    console.log(
      `✅ Prisma connected to database [${process.env.NODE_ENV}] — ${
        process.env.DATABASE_URL?.split("@")[1]?.split("?")[0] ?? ""
      }`
    )
  )
  .catch((err) => {
    console.error("🚨 Prisma connection failed:", err.message);
    process.exit(1);
  });

// ✅ Use a single instance in dev, new in production
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
