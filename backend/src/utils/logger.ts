import pino from "pino";
import pinoHttp from "pino-http";
import type { IncomingMessage, ServerResponse } from "http";

const isProd = process.env.NODE_ENV === "production";

/**
 * 🪵 Pino Logger (Level 1)
 * ------------------------------------------------------------
 * High-performance JSON logger with pretty-print for development.
 * Integrates seamlessly with Express via pino-http.
 */
export const logger = pino({
  level: isProd ? "info" : "debug",
  ...(isProd
    ? {} // Production → plain JSON logs (structured for Railway/Vercel)
    : {
        transport: {
          targets: [
            {
              target: require.resolve("pino-pretty"),
              options: {
                colorize: true,
                translateTime: "HH:MM:ss",
                ignore: "pid,hostname",
              },
            },
          ],
        },
      }),
});

/**
 * 🌐 HTTP Logger Middleware
 * ------------------------------------------------------------
 * Automatically logs all incoming requests and responses with
 * contextual info for debugging and observability.
 *
 * Example log:
 *   GET /api/auth/session → 200
 */
export const httpLogger = pinoHttp<IncomingMessage, ServerResponse>({
  logger,
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} → ${res.statusCode} (${err.message})`,

  // Optional: Include unique request ID for tracing (future Level 1.5)
  // genReqId: () => crypto.randomUUID(),
});
