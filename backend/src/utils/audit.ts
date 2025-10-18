import prisma from "../prisma/client";

/**
 * Records auth/user activity into the AuditLog table.
 */
export async function logAudit(
  action: string,
  userId?: string,
  ip?: string,
  userAgent?: string
) {
  try {
    await prisma.auditLog.create({
      data: { action, userId, ipAddress: ip, userAgent },
    });
  } catch (err) {
    console.error("Audit log error:", (err as Error).message);
  }
}
