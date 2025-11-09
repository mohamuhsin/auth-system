import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request, Response } from "express";
import { logAudit } from "../utils/audit";
import { AuditAction } from "@prisma/client";

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_ATTEMPTS = Number(process.env.RATE_LIMIT_MAX || 10);

export const authRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request) => ipKeyGenerator(req.ip || "unknown"),

  message: {
    status: "error",
    code: 429,
    message: "Too many attempts. Please try again later.",
  },

  handler: async (req: Request, res: Response, _next, options) => {
    try {
      await logAudit(
        AuditAction.RATE_LIMIT_HIT,
        null,
        req.ip ?? null,
        req.headers["user-agent"] ?? null,
        {
          reason: "RATE_LIMIT_EXCEEDED",
          route: req.originalUrl,
          method: req.method,
          limit: MAX_ATTEMPTS,
          windowMs: WINDOW_MS,
          severity: "WARN",
        }
      );
    } catch (err) {
      console.error("[RateLimiter] Failed to log audit:", err);
    }

    res.status(options.statusCode ?? 429).json(options.message);
  },
});
