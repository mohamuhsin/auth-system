import prisma from "../prisma/client";
import { AuditAction } from "@prisma/client";
import { logger } from "./logger";

/**
 * 🧾 logAudit (Level 2.0 Hardened)
 * ------------------------------------------------------------
 * Records auth or activity events into the AuditLog table.
 * - Uses enum-safe `AuditAction`
 * - Never throws (silent fallback)
 * - Structured metadata with context, timestamp, severity
 */
export async function logAudit(
  action: AuditAction,
  userId?: string | null,
  ip?: string | null,
  userAgent?: string | string[] | null,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    // ✅ Validate action at runtime (extra guard for dev)
    if (!Object.values(AuditAction).includes(action)) {
      logger.warn({ action }, "Invalid AuditAction enum provided");
      return;
    }

    const data = {
      action,
      userId: userId ?? null,
      ipAddress: ip ?? null,
      userAgent: Array.isArray(userAgent)
        ? userAgent.join("; ")
        : userAgent ?? null,
      message: metadata.reason || null,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        severity: metadata.severity || "INFO",
      },
      requestId: metadata.requestId || null,
    };

    await prisma.auditLog.create({ data });
  } catch (err: any) {
    // 🧱 Never interrupt critical auth flow
    logger.error({
      msg: "⚠️ Failed to log audit",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}
