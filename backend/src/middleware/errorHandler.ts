import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * 🧰 Global Error Handler (Level 1)
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
  // 🔍 Log full details to centralized logger
  logger.error({
    name: err.name,
    message: err.message,
    stack: err.stack,
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
    ok: false,
    status: "error",
    code: statusCode,
    message,
  });
}
