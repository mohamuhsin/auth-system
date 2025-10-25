import cors, { CorsOptions } from "cors";

/**
 * 🌍 CORS Middleware — Level 1 (Production Safe)
 * ------------------------------------------------------------
 * Dynamically allows only whitelisted origins for secure cross-domain requests.
 * Reads from `AUTH_ALLOWED_ORIGINS` (comma-separated list)
 *
 * Example:
 * AUTH_ALLOWED_ORIGINS=https://auth.iventics.com,https://auth-system-psi-indol.vercel.app,https://ugapay.ug,http://localhost:3000
 */
const allowedOrigins = (process.env.AUTH_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsConfig: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // ✅ allow Postman, curl, etc.

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // ✅ Optional: wildcard support for subdomains
    if (allowedOrigins.some((allowed) => origin.endsWith(allowed)))
      return callback(null, true);

    console.warn(`🚫 Blocked CORS origin: ${origin}`);
    return callback(new Error("CORS: Origin not allowed"));
  },

  credentials: true, // ✅ required for cross-domain cookies
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
