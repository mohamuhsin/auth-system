import cors, { CorsOptions } from "cors";

const corsConfig: CorsOptions = {
  origin(origin, callback) {
    const allowed = (process.env.AUTH_ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Allow Postman / server-to-server requests
    if (!origin) return callback(null, true);

    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`Blocked CORS origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

export const corsMiddleware = cors(corsConfig);
