import { PrismaClient } from "@prisma/client";

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

async function verifyPrismaConnection(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await prisma.$connect();
    const dbHost = dbUrl.split("@")[1]?.split("?")[0] ?? "unknown-db";
    console.log(`✅ Prisma connected → ${dbHost}`);
  } catch (err: any) {
    console.error("🚨 Prisma connection failed:", err.message);
    process.exit(1);
  }
}
void verifyPrismaConnection();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
