import cors, { CorsOptions } from "cors";
import { logger } from "./logger";
import { logAudit } from "./audit";
import { AuditAction } from "@prisma/client";

/**
 * 🌍 CORS Middleware — Level 2.0 Hardened (Final)
 * ------------------------------------------------------------
 * ✅ Works with cross-domain cookies (.iventics.com)
 * ✅ Handles wildcards (e.g., spin.ugapay.ug)
 * ✅ Includes `Access-Control-Allow-Credentials`
 * ✅ Logs & audits blocked origins safely
 *
 * Example .env:
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
    // Allow Postman, curl, SSR, same-origin
    if (!origin) return callback(null, true);

    // ✅ Exact match
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // ✅ Wildcard subdomain match
    const allowed = allowedOrigins.find((allowed) => {
      const base = allowed.replace(/^https?:\/\//, "");
      return origin === allowed || origin.endsWith(`.${base}`);
    });
    if (allowed) return callback(null, true);

    // 🚫 Otherwise block
    logger.warn({ origin }, "🚫 Blocked by CORS policy");

    void logAudit(AuditAction.RATE_LIMIT_HIT, null, null, null, {
      reason: "CORS_ORIGIN_BLOCKED",
      origin,
    });

    return callback(new Error(`CORS: Origin not allowed → ${origin}`));
  },

  // 🔒 Required for cross-domain cookies
  credentials: true,

  // Standardized safe defaults
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie"], // let browser see the cookie
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsConfig);
