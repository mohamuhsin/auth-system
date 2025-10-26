import pino from "pino";
import pinoHttp from "pino-http";
import crypto from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import { safeError } from "./errors";

/**
 * 🪵 Pino Logger — Level 2.0 Hardened
 * ------------------------------------------------------------
 * • Structured JSON logs in production.
 * • Pretty-printed developer logs in dev.
 * • Adds requestId + service context for correlation.
 * • Safe error serialization via safeError().
 */

const isProd = process.env.NODE_ENV === "production";
const serviceName = process.env.SERVICE_NAME || "auth-api";

/* ============================================================
   🎯 Base Logger
============================================================ */
export const logger = pino({
  name: serviceName,
  level: isProd ? "info" : "debug",
  base: undefined, // cleaner logs (no pid/hostname)
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "req.headers['set-cookie']",
  ],
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

  // ✅ Per-request UUID (correlates across microservices)
  genReqId: (req) => {
    const id = crypto.randomUUID();
    (req as any).requestId = id;
    return id;
  },

  // ✅ Add custom fields to each request log
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

  quietReqLogger: !isProd, // Less noise in dev
});

/* ============================================================
   🧱 Helper Shortcuts
============================================================ */
export const logInfo = (msg: string, ctx: Record<string, any> = {}) =>
  logger.info({ service: serviceName, ...ctx }, msg);

export const logWarn = (msg: string, ctx: Record<string, any> = {}) =>
  logger.warn({ service: serviceName, ...ctx }, msg);

export const logError = (err: unknown, ctx: Record<string, any> = {}) =>
  logger.error(
    { service: serviceName, ...ctx, error: safeError(err) },
    "Error logged"
  );
