import cors, { CorsOptions } from "cors";
import { logger } from "./logger";
import { logAudit } from "./audit";
import { AuditAction } from "@prisma/client";

const allowedOrigins = (process.env.AUTH_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (process.env.NODE_ENV !== "production") {
  if (!allowedOrigins.includes("http://localhost:3000")) {
    allowedOrigins.push("http://localhost:3000");
  }
}

if (!allowedOrigins.some((o) => o.includes("vercel.app"))) {
  allowedOrigins.push("vercel.app");
}

if (!allowedOrigins.length) {
  logger.warn(
    "⚠️  No AUTH_ALLOWED_ORIGINS defined — all origins will be blocked in production."
  );
}

const corsConfig: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    const allowed = allowedOrigins.find((allowed) => {
      const base = allowed.replace(/^https?:\/\//, "");
      return (
        origin === allowed ||
        origin.endsWith(`.${base}`) ||
        (base === "vercel.app" && origin.includes(".vercel.app"))
      );
    });

    if (allowed) return callback(null, true);

    logger.warn({ origin }, "Blocked by CORS policy");
    void logAudit(AuditAction.RATE_LIMIT_HIT, null, null, null, {
      reason: "CORS_ORIGIN_BLOCKED",
      origin,
      severity: "WARN",
    });

    return callback(new Error(`CORS: Origin not allowed → ${origin}`));
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "x-request-id",
    "cache-control",
    "pragma",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsConfig);
