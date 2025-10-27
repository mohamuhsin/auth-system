import prisma from "../prisma/client";
import { AuditAction } from "@prisma/client";
import { logger } from "./logger";

/**
 * 🧾 logAudit (Level 2.5 Hardened)
 * ------------------------------------------------------------
 * Writes structured audit events into the `AuditLog` table.
 *
 * ✅ Uses enum-safe `AuditAction`
 * ✅ Never throws (safe fallback on DB errors)
 * ✅ Adds metadata timestamp + severity
 * ✅ Joins multi-string user-agents cleanly
 * ✅ Logs dev-mode stack traces for easier debugging
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
    // 🧩 Runtime guard: ensure valid enum value
    // ------------------------------------------------------------
    if (!Object.values(AuditAction).includes(action)) {
      logger.warn(
        { action },
        "⚠️ Invalid AuditAction provided — skipping log."
      );
      return;
    }

    // ------------------------------------------------------------
    // 🧩 Build audit payload
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
    // 🧾 Persist to DB
    // ------------------------------------------------------------
    await prisma.auditLog.create({ data });
  } catch (err: any) {
    // ------------------------------------------------------------
    // 🚫 Never interrupt critical auth flow
    // ------------------------------------------------------------
    logger.error({
      msg: "⚠️ Failed to log audit",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}
