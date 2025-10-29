import cors, { CorsOptions } from "cors";
import { logger } from "./logger";
import { logAudit } from "./audit";
import { AuditAction } from "@prisma/client";

/**
 * 🌍 CORS Middleware — Level 2.6 (Hardened + Smart Wildcards)
 * ------------------------------------------------------------
 * ✅ Supports `.iventics.com` cross-domain cookies
 * ✅ Auto-allows Vercel preview subdomains (`*.vercel.app`)
 * ✅ Allows localhost in dev
 * ✅ Logs and audits blocked origins
 * ✅ Handles preflight OPTIONS safely
 */

const allowedOrigins = (process.env.AUTH_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

// 🧩 Always allow localhost in non-production
if (process.env.NODE_ENV !== "production") {
  if (!allowedOrigins.includes("http://localhost:3000")) {
    allowedOrigins.push("http://localhost:3000");
  }
}

// 🧩 Auto-add .vercel.app wildcard for preview deployments
if (!allowedOrigins.some((o) => o.includes("vercel.app"))) {
  allowedOrigins.push("vercel.app");
}

if (!allowedOrigins.length) {
  logger.warn(
    "⚠️  No AUTH_ALLOWED_ORIGINS defined — all origins will be blocked in production."
  );
}

/* ============================================================
   ⚙️ CORS Configuration
============================================================ */
const corsConfig: CorsOptions = {
  origin(origin, callback) {
    // ✅ Allow Postman, server-to-server, SSR
    if (!origin) return callback(null, true);

    // ✅ Exact match
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // ✅ Wildcard subdomain or suffix match
    const allowed = allowedOrigins.find((allowed) => {
      const base = allowed.replace(/^https?:\/\//, "");
      return (
        origin === allowed ||
        origin.endsWith(`.${base}`) ||
        // ✅ also allow vercel.app project URLs
        (base === "vercel.app" && origin.includes(".vercel.app"))
      );
    });
    if (allowed) return callback(null, true);

    // 🚫 Block unauthorized origin
    logger.warn({ origin }, "🚫 Blocked by CORS policy");

    void logAudit(AuditAction.RATE_LIMIT_HIT, null, null, null, {
      reason: "CORS_ORIGIN_BLOCKED",
      origin,
      severity: "WARN",
    });

    return callback(new Error(`CORS: Origin not allowed → ${origin}`));
  },

  credentials: true, // ✅ Required for secure cookie auth
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
