import cors, { CorsOptions } from "cors";
import { logger } from "./logger";
import { logAudit } from "./audit";
import { AuditAction } from "@prisma/client";

/**
 * 🌍 CORS Middleware — Level 2.5 Hardened (Auth by Iventics)
 * ------------------------------------------------------------
 * ✅ Works with cross-domain cookies (.iventics.com)
 * ✅ Supports wildcards & local dev
 * ✅ Logs & audits blocked origins
 * ✅ Gracefully handles preflights
 */

const allowedOrigins = (process.env.AUTH_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

// 🧩 Always allow localhost in development
if (process.env.NODE_ENV !== "production") {
  if (!allowedOrigins.includes("http://localhost:3000")) {
    allowedOrigins.push("http://localhost:3000");
  }
}

if (!allowedOrigins.length) {
  logger.warn(
    "⚠️ No AUTH_ALLOWED_ORIGINS defined — all origins will be blocked in production."
  );
}

/* ============================================================
   ⚙️ CORS Config
============================================================ */
const corsConfig: CorsOptions = {
  origin(origin, callback) {
    // 🧠 Allow server-to-server / Postman / SSR
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

    // Let Express handle gracefully
    const err = new Error(`CORS: Origin not allowed → ${origin}`);
    return callback(err as Error);
  },

  credentials: true, // ✅ required for cookies
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

/* ============================================================
   🧩 Export Middleware
============================================================ */
export const corsMiddleware = cors(corsConfig);
