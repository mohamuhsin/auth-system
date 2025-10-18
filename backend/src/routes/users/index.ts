import { Router } from "express";
import me from "./me";

const router = Router();

/**
 * 👥 User Routes
 * Handles all endpoints under /api/users
 * - GET /api/users/me → returns authenticated user's profile
 */
router.use("/me", me);

export default router;
