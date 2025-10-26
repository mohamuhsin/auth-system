import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";
import { logAudit } from "../utils/audit";
import { AuditAction } from "@prisma/client";

/* ============================================================
   ⚙️ Environment Configuration
============================================================ */
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000); // 1 minute
const MAX_ATTEMPTS = Number(process.env.RATE_LIMIT_MAX || 10);

/* ============================================================
   🚦 Auth Rate Limiter — Level 2.0 (IPv6 Safe + Audited)
============================================================ */
export const authRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,

  /* ✅ Proper IPv6-safe key generator wrapper */
  keyGenerator: (req: Request) => {
    try {
      // ipKeyGenerator expects a string IP and returns a normalized key
      return ipKeyGenerator(req.ip || "unknown");
    } catch {
      return req.ip || "unknown";
    }
  },

  message: {
    status: "error",
    message: "Too many attempts, please try again later.",
  },

  /* ============================================================
     🧾 Handler — Audit every rate limit hit
  ============================================================ */
  handler: async (req, res, _next, options) => {
    try {
      await logAudit(
        AuditAction.RATE_LIMIT_HIT,
        null,
        req.ip ?? null,
        req.headers["user-agent"] ?? null,
        {
          route: req.originalUrl,
          method: req.method,
          limit: MAX_ATTEMPTS,
          windowMs: WINDOW_MS,
        }
      );
    } catch (err) {
      console.error("[RateLimiter] Failed to log audit:", err);
    }

    res.status(options.statusCode).json(options.message);
  },
});
