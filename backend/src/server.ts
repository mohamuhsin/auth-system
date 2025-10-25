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

const app = express();

/**
 * 🚀 Iventics Auth API (Level 1.5 – Production Ready)
 * ------------------------------------------------------------
 * Secure authentication and session service for all Iventics apps.
 * Uses Firebase Admin + Prisma + Express with cookie-based sessions.
 */

// 🧱 Core middleware
app.disable("x-powered-by");
app.use(helmet());
app.use(httpLogger);
app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);

// 🩺 Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "success", message: "Auth API is healthy" });
});

// 🔐 Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ⚠️ Global error handler (must remain last)
app.use(errorHandler);

// 🚀 Start server
const PORT = Number(process.env.PORT || 4000);
const HOST = "0.0.0.0"; // ✅ required for Railway/Vercel/Docker

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Auth API running on http://${HOST}:${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// 🧹 Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("👋 Graceful shutdown (SIGTERM received)");
  process.exit(0);
});
