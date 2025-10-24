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
 * 🚀 Iventics Auth API (Level 1)
 * ------------------------------------------------------------
 * Secure authentication and session service for all Iventics apps.
 * Uses Firebase Admin + Prisma + Express with cookie-based sessions.
 */

// 🧱 Core middleware
app.disable("x-powered-by");
app.use(helmet()); // Security headers
app.use(httpLogger); // Structured request logging
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Handle cookies
app.use(corsMiddleware); // Cross-domain sessions for subdomains

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
app.listen(PORT, () => {
  logger.info(`🚀 Auth API running on http://localhost:${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// 🧹 Graceful shutdown (optional for Railway/Vercel)
process.on("SIGTERM", () => {
  logger.info("👋 Graceful shutdown (SIGTERM received)");
  process.exit(0);
});
