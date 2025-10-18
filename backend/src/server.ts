import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./utils/cors";
import { httpLogger } from "./utils/logger";
import authRoutes from "./routes/auth";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(httpLogger);
app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () =>
  console.log(`🚀 Auth API running on http://localhost:${PORT}`)
);
