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
  userId?: string, // internal UUID preferred
  ip?: string,
  userAgent?: string
) {
  try {
    // 🪶 Fire-and-forget mode (non-blocking)
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || null,
        ipAddress: ip || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err: any) {
    console.error("❌ Audit log error:", err.message);
  }
}
