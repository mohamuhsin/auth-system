import cors, { CorsOptions } from "cors";

/**
 * 🌍 CORS Middleware — Level 1 (Production Safe)
 * ------------------------------------------------------------
 * Dynamically allows only whitelisted origins for secure cross-domain requests.
 * Reads from `AUTH_ALLOWED_ORIGINS` (comma-separated list)
 *
 * Example:
 * AUTH_ALLOWED_ORIGINS=https://auth.iventics.com,https://auth-system-psi-indol.vercel.app,https://ugapay.ug,http://localhost:3000
 *
 * Enables credentials (cookies) for session-based auth across subdomains.
 */
const allowedOrigins = (process.env.AUTH_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsConfig: CorsOptions = {
  origin(origin, callback) {
    // 🧪 Allow requests without origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`🚫 Blocked CORS origin: ${origin}`);
    return callback(new Error("CORS: Origin not allowed"));
  },

  credentials: true, // ✅ Allow cookies / session headers

  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ include OPTIONS for preflight
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsConfig);
