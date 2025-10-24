import cors, { CorsOptions } from "cors";

/**
 * 🌍 CORS Middleware (Level 1)
 * ------------------------------------------------------------
 * Dynamically allows only whitelisted origins for secure cross-domain requests.
 * Reads from `AUTH_ALLOWED_ORIGINS` env (comma-separated list).
 *
 * Examples:
 *   AUTH_ALLOWED_ORIGINS=https://auth.iventics.com,https://ugapay.ug,http://localhost:3000
 *
 * Enables credentials (cookies) for session-based auth across subdomains.
 */
const corsConfig: CorsOptions = {
  origin(origin, callback) {
    const allowed = (process.env.AUTH_ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // 🧪 Allow requests without origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`🚫 Blocked CORS origin: ${origin}`);
    callback(new Error("CORS: Origin not allowed"));
  },
  credentials: true,
};

export const corsMiddleware = cors(corsConfig);
