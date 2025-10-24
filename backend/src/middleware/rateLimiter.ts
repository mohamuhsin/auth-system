import rateLimit from "express-rate-limit";

/**
 * 🛡️ Auth Rate Limiter (Level 1)
 * ------------------------------------------------------------
 * Restricts brute-force attempts on login/signup routes.
 * Current config: 10 requests per minute per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many attempts, please try again later.",
  },
});
