import prisma from "../prisma/client";

/**
 * 🧾 logAudit
 * ------------------------------------------------------------
 * Records authentication or user activity events
 * into the AuditLog table for traceability.
 *
 * Automatically captures:
 *  - action (string)
 *  - userId (optional)
 *  - ipAddress (optional)
 *  - userAgent (optional)
 *
 * Prisma auto-sets `createdAt` timestamp.
 */
export async function logAudit(
  action: string,
  userId?: string,
  ip?: string,
  userAgent?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        ipAddress: ip,
        userAgent,
      },
    });
  } catch (err: any) {
    console.error("❌ Audit log error:", err.message);
  }
}
