import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { safeError } from "../utils/errors";

/**
 * 🧱 Global Error Handler — Level 2.5 Hardened (Auth by Iventics)
 * ------------------------------------------------------------
 * • Captures all uncaught or thrown errors in Express routes
 * • Normalizes Prisma, Firebase, and generic errors
 * • Logs with rich context using Pino + safeError()
 * • Always returns a consistent JSON structure
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isProd = process.env.NODE_ENV === "production";

  // If headers are already sent → delegate to Express default
  if (res.headersSent) return next(err);

  // 🧩 Normalize error shape
  const e =
    err && typeof err === "object"
      ? (err as {
          name?: string;
          message?: string;
          code?: string;
          status?: number;
          stack?: string;
        })
      : { message: String(err) };

  const status = e.status ?? mapToHttpStatus(e.code) ?? 500;

  const message =
    status >= 500
      ? "Internal server error"
      : e.message || "Something went wrong";

  // 🧾 Structured logging (always safe)
  logger.error({
    name: e.name ?? "UnknownError",
    code: e.code ?? "UNKNOWN",
    status,
    path: req.path,
    method: req.method,
    error: safeError(e),
    stack: isProd ? undefined : e.stack,
  });

  // ✅ Uniform JSON response
  res.status(status).json({
    status: "error",
    success: false,
    code: status,
    message,
    ...(isProd ? {} : { stack: e.stack }),
  });
}

/**
 * 🔍 mapToHttpStatus
 * ------------------------------------------------------------
 * Maps known Prisma & Firebase codes → appropriate HTTP status.
 */
function mapToHttpStatus(code?: string): number | undefined {
  switch (code) {
    // ⚙️ Prisma constraint violations
    case "P2002": // Unique constraint failed
      return 409;

    // 🔐 Firebase Auth errors
    case "auth/invalid-id-token":
    case "auth/id-token-expired":
      return 401;
    case "auth/user-disabled":
      return 403;
    case "auth/user-not-found":
      return 404;
    case "auth/email-already-exists":
      return 409;

    default:
      return undefined;
  }
}
