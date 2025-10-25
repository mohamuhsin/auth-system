import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { safeError } from "../utils/errors";

/**
 * 🧰 Global Error Handler (Level 1.5)
 * ------------------------------------------------------------
 * Logs unexpected errors and returns a safe, consistent JSON
 * response without leaking stack traces or sensitive details.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // 🔍 Log safely with stack trace in development
  logger.error({
    name: err?.name || "UnknownError",
    message: safeError(err),
    stack: process.env.NODE_ENV !== "production" ? err?.stack : undefined,
    code: err?.code || undefined,
  });

  // 🧾 Determine HTTP status
  const statusCode = err.status || 500;

  // 🧩 Safe message for client
  const message =
    statusCode === 500
      ? "Internal server error"
      : err.message || "Something went wrong";

  // 🎯 Unified structured response
  res.status(statusCode).json({
    success: false,
    status: "error",
    code: statusCode,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err?.stack }),
  });
}
