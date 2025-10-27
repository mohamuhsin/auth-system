import { Router } from "express";
import { authRateLimiter } from "../../middleware/rateLimiter";

// 🔹 Core session routes
import session from "./session";
import logout from "./logout";

// 🔹 Firebase Auth routes
import loginWithFirebase from "./login-with-firebase";
import signupWithFirebase from "./signup-with-firebase";

const router = Router();

/* ============================================================
   🔐 AUTH ROUTES (Level 2.5 — Hardened)
   ------------------------------------------------------------
   • Uses Firebase ID tokens + secure session cookies
   • Protected by rate limiter middleware
   • Exposes unified endpoints:
     /auth/session
     /auth/login-with-firebase
     /auth/signup-with-firebase
     /auth/logout
============================================================ */

router.use(authRateLimiter);

/**
 * 🧩 Session Management
 * - Creates/refreshes session cookies from Firebase tokens
 */
router.use("/session", session);

/**
 * 🚪 Logout
 * - Revokes Firebase tokens, clears cookies, removes DB session
 */
router.use("/logout", logout);

/**
 * 🔑 Login with Firebase
 * - Verifies Firebase ID token → issues secure cookie session
 * - Supports Google & Email/Password sign-ins
 */
router.use("/login-with-firebase", loginWithFirebase);

/**
 * 🆕 Signup with Firebase
 * - Creates new user from Firebase token
 * - Auto-assigns ADMIN to first user
 * - Enforces email verification before auto-login
 */
router.use("/signup-with-firebase", signupWithFirebase);

export default router;
