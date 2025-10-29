import pino from "pino";
import pinoHttp from "pino-http";
import crypto from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import { safeError } from "./errors";

/**
 * 🪵 Pino Logger — Level 2.5 Hardened (Auth by Iventics)
 * ------------------------------------------------------------
 * ✅ Structured JSON logs in production
 * ✅ Pretty-printed developer logs in dev
 * ✅ requestId + service context for correlation
 * ✅ Safe error serialization via safeError()
 */

const isProd = process.env.NODE_ENV === "production";
const serviceName = process.env.SERVICE_NAME || "auth-api";

/* ============================================================
   🎯 Base Logger (Singleton)
============================================================ */
export const logger = pino({
  name: serviceName,
  level: isProd ? "info" : "debug",
  base: undefined, // cleaner logs (omit pid/hostname)
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "req.headers['set-cookie']",
  ],
  formatters: {
    level(label) {
      return { level: label.toUpperCase() };
    },
  },
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

/* ============================================================
   🌐 HTTP Logger Middleware (Express)
============================================================ */
export const httpLogger = pinoHttp<IncomingMessage, ServerResponse>({
  logger,

  // ✅ Per-request UUID for trace correlation
  genReqId: (req) => {
    const id = crypto.randomUUID();
    (req as any).requestId = id;
    return id;
  },

  // ✅ Enrich every log entry with context
  customProps: (req, res) => ({
    requestId: (req as any).requestId,
    service: serviceName,
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  }),

  customSuccessMessage: (req, res) =>
    `✅ ${req.method} ${req.url} → ${res.statusCode}`,

  customErrorMessage: (req, res, err) =>
    `🔥 ${req.method} ${req.url} → ${res.statusCode} :: ${safeError(err)}`,

  customAttributeKeys: {
    req: "request",
    res: "response",
    err: "error",
  },

  quietReqLogger: !isProd, // less noise in dev
});

/* ============================================================
   🧱 Helper Shortcuts
============================================================ */

/**
 * Info-level log
 */
export const logInfo = (msg: string, ctx: Record<string, any> = {}): void => {
  logger.info({ service: serviceName, ...ctx }, msg);
};

/**
 * Warn-level log
 */
export const logWarn = (msg: string, ctx: Record<string, any> = {}): void => {
  logger.warn({ service: serviceName, ...ctx }, msg);
};

/**
 * Error-level log (uses safeError)
 */
export const logError = (err: unknown, ctx: Record<string, any> = {}): void => {
  logger.error(
    { service: serviceName, ...ctx, error: safeError(err) },
    "❌ Error logged"
  );
};
