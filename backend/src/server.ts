import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./utils/cors";
import { httpLogger } from "./utils/logger";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// 🧱 Core middleware
app.disable("x-powered-by");
app.use(helmet());
app.use(httpLogger);
app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);

// 🩺 Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// 🔐 Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ⚠️ Global error handler (must be last)
app.use(errorHandler);

// 🚀 Start server
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`🚀 Auth API running on http://localhost:${PORT}`);
});
