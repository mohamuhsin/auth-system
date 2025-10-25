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

/**
 * 🚀 Iventics Auth API (Level 1.5 — Production Ready)
 * ------------------------------------------------------------
 * Secure authentication and session service for all Iventics apps.
 * Uses Firebase Admin + Prisma ORM + Express with cookie-based sessions.
 */

const app = express();

// 🧱 Core middleware
app.disable("x-powered-by");
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(corsMiddleware);
app.use(httpLogger);

/* ============================================================
   🩺 Health Check Endpoint — Used by Frontend Sidebar
============================================================ */
app.get("/api/health", async (_req, res) => {
  try {
    const start = Date.now();

    // (Optional) Perform deeper checks here, e.g. DB or Firebase
    const latency = Date.now() - start;

    res.status(200).json({
      ok: true, // ✅ required by frontend
      maintenance: false,
      latency, // measured round-trip ms
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({
      ok: false,
      maintenance: false,
      message: "Health check failed",
    });
  }
});

/* ============================================================
   🔐 Core Routes
============================================================ */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

/* ============================================================
   ⚠️ Global Error Handler
============================================================ */
app.use(errorHandler);

/* ============================================================
   🚀 Server Startup
============================================================ */
const PORT = Number(process.env.PORT || 4000);
const HOST = "0.0.0.0"; // ✅ Required for Railway/Vercel/Docker

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Auth API running on http://${HOST}:${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

/* ============================================================
   🧹 Graceful Shutdown
============================================================ */
process.on("SIGTERM", () => {
  logger.info("👋 Graceful shutdown (SIGTERM received)");
  process.exit(0);
});
