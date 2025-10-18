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
  // Log full error details to pino logger
  logger.error({
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  // Decide HTTP status
  const status = err.status || 500;

  // Sanitize message for client
  const message =
    status === 500
      ? "Internal server error"
      : err.message || "Something went wrong";

  // Send structured JSON response
  res.status(status).json({
    ok: false,
    status,
    message,
  });
}
