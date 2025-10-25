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
 * 🚀 Iventics Auth API — Level 1.5 (Production Ready)
 */
const app = express();

// 🧱 Core middleware
app.disable("x-powered-by");
app.set("trust proxy", 1); // ✅ Required for secure cookies behind proxies
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(corsMiddleware);
app.use(httpLogger);

/* ============================================================
   🩺 Health Check
============================================================ */
app.get("/api/health", async (_req, res) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`; // optional DB ping
    const latency = Date.now() - start;

    res.status(200).json({
      ok: true,
      maintenance: false,
      latency,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({ ok: false, message: "Health check failed" });
  }
});

/* ============================================================
   🔐 Routes
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

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Auth API running on http://${HOST}:${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

/* ============================================================
   🧹 Graceful Shutdown
============================================================ */
process.on("SIGTERM", async () => {
  logger.info("👋 Graceful shutdown (SIGTERM received)");
  await prisma.$disconnect();
  process.exit(0);
});
