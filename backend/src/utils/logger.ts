import pino from "pino";
import pinoHttp from "pino-http";
import type { IncomingMessage, ServerResponse } from "http";
import { safeError } from "./errors";

const isProd = process.env.NODE_ENV === "production";

/**
 * 🪵 Pino Logger (Level 1.5)
 * ------------------------------------------------------------
 * High-performance JSON logger with pretty-print for development.
 * Integrates seamlessly with Express via pino-http.
 */
export const logger = pino({
  level: isProd ? "info" : "debug",
  ...(isProd
    ? {}
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
 * Logs all incoming requests and responses with contextual info.
 * Example log:
 *   GET /api/auth/session → 200
 */
export const httpLogger = pinoHttp<IncomingMessage, ServerResponse>({
  logger,
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} → ${res.statusCode} (${safeError(err)})`,

  // 🧠 Optional: unique request ID for tracing (future Level 1.5)
  // genReqId: () => crypto.randomUUID(),
});
