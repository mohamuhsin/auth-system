import pino from "pino";
import pinoHttp from "pino-http";
import crypto from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import { safeError } from "./errors";

const isProd = process.env.NODE_ENV === "production";
const serviceName = process.env.SERVICE_NAME || "auth-api";

export const logger = pino({
  name: serviceName,
  level: isProd ? "info" : "debug",
  base: undefined,
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

export const httpLogger = pinoHttp<IncomingMessage, ServerResponse>({
  logger,

  genReqId: (req) => {
    const id = crypto.randomUUID();
    (req as any).requestId = id;
    return id;
  },

  customProps: (req, res) => ({
    requestId: (req as any).requestId,
    service: serviceName,
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  }),

  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,

  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} → ${res.statusCode} :: ${safeError(err)}`,

  customAttributeKeys: {
    req: "request",
    res: "response",
    err: "error",
  },

  quietReqLogger: !isProd,
});

export const logInfo = (msg: string, ctx: Record<string, any> = {}): void => {
  logger.info({ service: serviceName, ...ctx }, msg);
};

export const logWarn = (msg: string, ctx: Record<string, any> = {}): void => {
  logger.warn({ service: serviceName, ...ctx }, msg);
};

export const logError = (err: unknown, ctx: Record<string, any> = {}): void => {
  logger.error(
    { service: serviceName, ...ctx, error: safeError(err) },
    "Error logged"
  );
};
