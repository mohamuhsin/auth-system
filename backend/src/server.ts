/* eslint-disable no-console */
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./utils/cors";
import { httpLogger, logger } from "./utils/logger";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import { errorHandler } from "./middleware/errorHandler";
import prisma from "./prisma/client";

/**
 * 🚀 Iventics Auth API — Level 2.5 Hardened
 * ------------------------------------------------------------
 *  ✅ Secure headers (Helmet)
 *  ✅ CORS + cookie-based session support
 *  ✅ Pino structured logging + request tracing
 *  ✅ Health check with DB ping
 *  ✅ Graceful shutdown for Railway/Vercel
 */

const app = express();

/* ============================================================
   🧱 Core Middleware
============================================================ */
app.disable("x-powered-by");
app.set("trust proxy", 1); // Required for secure cookies behind reverse proxies

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" })); // Prevent body bloat attacks
app.use(corsMiddleware);
app.use(httpLogger);

/* ============================================================
   🩺 Health Check Endpoint
============================================================ */
app.get("/api/health", async (_req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    res.status(200).json({
      ok: true,
      service: process.env.SERVICE_NAME || "auth-api",
      env: process.env.NODE_ENV,
      latency,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error({ err }, "❌ Health check failed");
    res.status(500).json({
      ok: false,
      message: "Health check failed",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/* ============================================================
   🔐 Main API Routes
============================================================ */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

/* ============================================================
   ⚠️ Global Error Handler
============================================================ */
app.use(errorHandler);

/* ============================================================
   🚀 Startup
============================================================ */
const PORT = Number(process.env.PORT || 4000);
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Auth API running on http://${HOST}:${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

/* ============================================================
   🧹 Graceful Shutdown & Fatal Safety
============================================================ */
async function shutdown(signal: string) {
  logger.warn(`⚠️ Received ${signal} — shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    server.close(() => {
      logger.info("✅ Server closed cleanly");
      process.exit(0);
    });
  } catch (err: any) {
    logger.error({ err }, "🔥 Error during shutdown");
    process.exit(1);
  }
}

["SIGTERM", "SIGINT"].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
});
