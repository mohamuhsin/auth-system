import { Router } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";

const router = Router();

/**
 * 🔐 POST /api/auth/login-with-firebase
 * Verifies Firebase ID token and creates a secure session cookie.
 */
router.post("/", async (req, res) => {
  try {
    const { idToken, userAgent } = req.body;

    if (!idToken) {
      return res
        .status(400)
        .json({ code: "ID_TOKEN_REQUIRED", message: "Missing ID token" });
    }

    // ✅ Verify Firebase token
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken, true);
    } catch (verifyErr) {
      console.error("❌ Invalid Firebase token:", verifyErr);
      return res
        .status(401)
        .json({ code: "INVALID_TOKEN", message: "Invalid or expired token" });
    }

    // ✅ Check if user exists in DB
    const existingUser = await prisma.user.findUnique({
      where: { email: decoded.email! },
    });

    if (!existingUser) {
      return res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "No account found. Please sign up first.",
      });
    }

    // ✅ Optional: mirror verification via metadata (only if column exists)
    // If you later add an `emailVerified` column to User:
    // await prisma.user.update({
    //   where: { id: existingUser.id },
    //   data: { emailVerified: decoded.email_verified ?? false },
    // });

    // ✅ Create session in DB
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

    // ✅ Create signed cookie
    const cookie = await makeSessionCookie(decoded.uid);

    res
      .cookie("__Secure-iventics_session", cookie, {
        httpOnly: true,
        secure: true,
        sameSite: "none", // ✅ important for cross-domain cookies
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
      .status(200)
      .json({
        status: "success",
        message: "Session created successfully",
        userId: existingUser.id,
        sessionId: session.id,
      });
  } catch (err) {
    console.error("🔥 login-with-firebase error:", err);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Something went wrong creating the session",
    });
  }
});

export default router;
