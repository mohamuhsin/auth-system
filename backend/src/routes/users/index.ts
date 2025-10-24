import { Router } from "express";
import me from "./me";
import all from "./all";

const router = Router();

/**
 * 👥 User Routes
 * ------------------------------------------------------------
 * - GET /api/users/me  → Authenticated user profile
 * - GET /api/users/all → ADMIN-only (list all users)
 */
router.use("/me", me);
router.use("/all", all);

export default router;
