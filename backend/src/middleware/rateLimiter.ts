import rateLimit from "express-rate-limit";
import { logAudit } from "../utils/audit";

/**
 * 🛡️ Auth Rate Limiter (Level 1.5)
 * ------------------------------------------------------------
 * Restricts brute-force attempts on login/signup routes.
 * Current config: 10 requests per minute per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown", // ✅ consistent keys
  message: {
    status: "error",
    message: "Too many attempts, please try again later.",
  },

  handler: async (req, res, next, options) => {
    // 🧾 Log rate-limit hits to audit table
    await logAudit(
      "RATE_LIMIT_HIT",
      undefined,
      req.ip,
      req.headers["user-agent"]
    );
    res.status(options.statusCode).json(options.message);
  },
});
