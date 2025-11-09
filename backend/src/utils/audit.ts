import prisma from "../prisma/client";
import { AuditAction } from "@prisma/client";
import { logger } from "./logger";

export async function logAudit(
  action: AuditAction,
  userId?: string | null,
  ip?: string | null,
  userAgent?: string | string[] | null,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    if (!Object.values(AuditAction).includes(action)) {
      logger.warn(
        { action },
        "⚠️ Invalid AuditAction provided — skipping log."
      );
      return;
    }

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

    await prisma.auditLog.create({ data });
  } catch (err: unknown) {
    const error = err as Error;
    logger.error({
      msg: "Failed to log audit",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
