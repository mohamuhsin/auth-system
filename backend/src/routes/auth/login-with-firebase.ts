import { Router } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";

const router = Router();

/**
 * 🔐 POST /api/auth/login-with-firebase
 * ------------------------------------------------------------
 * Verifies Firebase ID token and creates a secure session cookie.
 * Existing users only — new users must sign up via /signup-with-firebase.
 */
router.post("/", async (req, res) => {
  try {
    const { idToken, userAgent } = req.body;

    // 🧩 Validate input
    if (!idToken) {
      return res.status(400).json({
        status: "error",
        message: "Missing ID token",
      });
    }

    // ✅ Verify Firebase ID token
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken, true);
    } catch (verifyErr) {
      console.error("❌ Invalid Firebase token:", verifyErr);
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    // ✅ Find user by email
    const existingUser = await prisma.user.findUnique({
      where: { email: decoded.email! },
    });

    if (!existingUser) {
      await logAudit(
        "LOGIN_FAILED_USER_NOT_FOUND",
        undefined,
        req.ip,
        req.headers["user-agent"]
      );

      return res.status(404).json({
        status: "error",
        message: "No account found. Please sign up first.",
      });
    }

    // 🧩 Optional — sync email verification
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { emailVerified: decoded.email_verified ?? false },
    });

    // ✅ Create session record in DB
    const session = await prisma.session.create({
      data: {
        userId: existingUser.id,
        ipAddress:
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          null,
        userAgent: userAgent ?? req.headers["user-agent"] ?? null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
    });

    // ✅ Generate a secure Firebase session cookie (already serialized)
    const cookieHeader = await makeSessionCookie(idToken);

    // ✅ Send cookie to browser
    res.setHeader("Set-Cookie", cookieHeader);

    // ✅ Respond success
    res.status(200).json({
      status: "success",
      message: "Login successful",
      userId: existingUser.id,
      sessionId: session.id,
    });

    // 🧾 Record successful login
    await logAudit(
      "LOGIN_WITH_FIREBASE",
      existingUser.id,
      req.ip,
      req.headers["user-agent"]
    );
  } catch (err: any) {
    console.error("🔥 login-with-firebase error:", err.message);

    await logAudit(
      "LOGIN_WITH_FIREBASE_ERROR",
      undefined,
      req.ip,
      req.headers["user-agent"]
    );

    return res.status(500).json({
      status: "error",
      message: "Something went wrong creating the session",
    });
  }
});

export default router;
