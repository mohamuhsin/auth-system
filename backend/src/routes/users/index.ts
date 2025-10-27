import { Router } from "express";
import { logger } from "../../utils/logger";
import me from "./me";
import all from "./all";

const router = Router();

/**
 * 👥 USER ROUTES — Level 2.5 Hardened (Auth by Iventics)
 * ------------------------------------------------------------
 * • /api/users/me  → Returns authenticated user's profile
 * • /api/users/all → ADMIN-only (list all users)
 *
 * Each subroute:
 *  - Implements its own `authGuard()`
 *  - Handles audit logging internally
 *  - Returns unified `{ status, code, message }` structure
 */
router.use("/me", me);
router.use("/all", all);

/**
 * 🩺 Lightweight route health check
 * ------------------------------------------------------------
 * Useful for API uptime monitors or service discovery.
 */
router.get("/", (_req, res) =>
  res.status(200).json({
    ok: true,
    service: "auth-api",
    routes: ["/me", "/all"],
  })
);

/**
 * 🧠 Startup log — confirms route mount during server boot
 */
logger.info({
  msg: "📦 Mounted User Routes",
  basePath: "/api/users",
  endpoints: ["/me", "/all"],
});

export default router;
