import cors, { CorsOptions } from "cors";
import { logger } from "./logger";
import { logAudit } from "./audit";
import { AuditAction } from "@prisma/client";

/**
 * 🌍 CORS Middleware — Level 2.0 Hardened
 * ------------------------------------------------------------
 * Dynamically validates allowed origins for cross-domain cookies.
 * Supports sub-domains (spin.ugapay.ug) and Postman/CLI (no origin).
 *
 * Example ENV:
 * AUTH_ALLOWED_ORIGINS=https://auth.iventics.com,https://auth-api.iventics.com,https://ugapay.ug,http://localhost:3000
 */
const allowedOrigins = (process.env.AUTH_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (!allowedOrigins.length) {
  logger.warn(
    "⚠️  No AUTH_ALLOWED_ORIGINS defined — all origins will be blocked in production."
  );
}

const corsConfig: CorsOptions = {
  origin(origin, callback) {
    // Allow same-origin, SSR, or Postman calls
    if (!origin) return callback(null, true);

    // Strict match
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Wildcard sub-domain match
    const match = allowedOrigins.some((allowed) => {
      const base = allowed.replace(/^https?:\/\//, "");
      return origin === allowed || origin.endsWith(`.${base}`);
    });
    if (match) return callback(null, true);

    // 🚫 Blocked origin
    logger.warn({ origin }, "Blocked CORS origin");

    // Optional audit record
    void logAudit(AuditAction.RATE_LIMIT_HIT, null, null, null, {
      reason: "CORS_ORIGIN_BLOCKED",
      origin,
    });

    return callback(new Error("CORS: Origin not allowed"));
  },

  credentials: true, // cross-site cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsConfig);
