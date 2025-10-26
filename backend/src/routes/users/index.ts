import { Router } from "express";
import { logger } from "../../utils/logger";
import me from "./me";
import all from "./all";

const router = Router();

/**
 * 👥 User Routes — Level 2.0
 * ------------------------------------------------------------
 * - GET /api/users/me  → Authenticated user profile
 * - GET /api/users/all → ADMIN-only (list all users)
 *
 * All subroutes include their own authGuard and audit logging.
 */
router.use("/me", me);
router.use("/all", all);

// 🩺 Optional lightweight route health check
router.get("/", (_req, res) =>
  res.status(200).json({ ok: true, routes: ["/me", "/all"] })
);

// 🧠 Log during server startup
logger.info("📦 Mounted User Routes → [/me, /all]");

export default router;
