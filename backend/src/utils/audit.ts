import prisma from "../prisma/client";
import { AuditAction } from "@prisma/client";
import { logger } from "./logger";

/**
 * 🧾 logAudit — Level 2.5 Hardened (Auth by Iventics)
 * ------------------------------------------------------------
 * Writes structured audit events into the `AuditLog` table.
 *
 * ✅ Enum-safe `AuditAction`
 * ✅ Never throws (graceful fallback on DB errors)
 * ✅ Adds metadata timestamp + severity
 * ✅ Joins multi-string user-agents cleanly
 * ✅ Logs stack trace in dev mode for debug visibility
 */
export async function logAudit(
  action: AuditAction,
  userId?: string | null,
  ip?: string | null,
  userAgent?: string | string[] | null,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    // ------------------------------------------------------------
    // 🧩 Runtime validation: ensure valid enum value
    // ------------------------------------------------------------
    if (!Object.values(AuditAction).includes(action)) {
      logger.warn(
        { action },
        "⚠️ Invalid AuditAction provided — skipping log."
      );
      return;
    }

    // ------------------------------------------------------------
    // 🧩 Build structured audit payload
    // ------------------------------------------------------------
    const data = {
      action,
      userId: userId ?? null,
      ipAddress: ip ?? null,
      userAgent: Array.isArray(userAgent)
        ? userAgent.join("; ")
        : userAgent ?? null,
      message: metadata.reason ?? null,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        severity: metadata.severity ?? "INFO",
      },
      requestId: metadata.requestId ?? null,
    };

    // ------------------------------------------------------------
    // 🧾 Persist event to database
    // ------------------------------------------------------------
    await prisma.auditLog.create({ data });
  } catch (err: unknown) {
    // ------------------------------------------------------------
    // 🚫 Never interrupt authentication or critical flow
    // ------------------------------------------------------------
    const error = err as Error;
    logger.error({
      msg: "⚠️ Failed to log audit",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
