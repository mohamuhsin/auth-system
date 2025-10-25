import { Router } from "express";
import { authRateLimiter } from "../../middleware/rateLimiter";

// 🟢 Existing routes
import session from "./session";
import logout from "./logout";

// ✨ New Firebase routes
import loginWithFirebase from "./login-with-firebase";
import signupWithFirebase from "./signup-with-firebase";

const router = Router();

/* ============================================================
   🔐 AUTH ROUTES
============================================================ */

router.use(authRateLimiter);

// Get current session
router.use("/session", session);

// Logout
router.use("/logout", logout);

// 🔵 Firebase-based login (Google or Email)
router.use("/login-with-firebase", loginWithFirebase);

// 🟢 Firebase-based signup (Google signup flow)
router.use("/signup-with-firebase", signupWithFirebase);

export default router;
