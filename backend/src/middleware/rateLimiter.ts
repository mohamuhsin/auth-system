import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";
import { logAudit } from "../utils/audit";
import { AuditAction } from "@prisma/client";

/* ============================================================
   ⚙️ Environment Configuration
   ------------------------------------------------------------
   Controls rate limiting window and max attempts globally
   (configurable via .env)
============================================================ */
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000); // 1 minute
const MAX_ATTEMPTS = Number(process.env.RATE_LIMIT_MAX || 10);

/* ============================================================
   🚦 Auth Rate Limiter — Level 2.5 (IPv6 Safe + Audited)
   ------------------------------------------------------------
   • IPv6-safe key normalization
   • Structured audit logs for every hit
   • Designed specifically for /auth routes
============================================================ */
export const authRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_ATTEMPTS,
  standardHeaders: true, // Send RateLimit-* headers
  legacyHeaders: false, // Disable deprecated X-RateLimit-* headers

  /* ✅ IPv6-safe key generator */
  keyGenerator: (req: Request) => {
    try {
      return ipKeyGenerator(req.ip || "unknown");
    } catch {
      return req.ip || "unknown";
    }
  },

  /* 🧱 Default response body */
  message: {
    status: "error",
    code: 429,
    message: "Too many attempts. Please try again later.",
  },

  /* ============================================================
     🧾 Handler — Audit every rate limit hit
     ------------------------------------------------------------
     - Logs AuditAction.RATE_LIMIT_HIT with full context
     - Never throws (graceful failure)
  ============================================================ */
  handler: async (req, res, _next, options) => {
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
        }
      );
    } catch (err) {
      console.error("⚠️ [RateLimiter] Failed to log audit:", err);
    }

    res.status(options.statusCode).json(options.message);
  },
});
