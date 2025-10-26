import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { safeError } from "../utils/errors";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const isProd = process.env.NODE_ENV === "production";

  if (res.headersSent) return _next(err);

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
  const msg =
    status === 500
      ? "Internal server error"
      : e.message || "Something went wrong";

  logger.error({
    name: e.name ?? "UnknownError",
    code: e.code ?? "UNKNOWN",
    message: safeError(e),
    stack: isProd ? undefined : e.stack,
    status,
  });

  res.status(status).json({
    success: false,
    status: "error",
    code: status,
    message: msg,
    ...(isProd ? {} : { stack: e.stack }),
  });
}

function mapToHttpStatus(code?: string): number | undefined {
  switch (code) {
    case "P2002":
      return 409;
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
