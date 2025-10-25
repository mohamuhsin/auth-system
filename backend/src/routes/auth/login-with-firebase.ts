// src/routes/auth/login-with-firebase.ts
import { Router } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";

const router = Router();

/**
 * POST /api/auth/login-with-firebase
 * Called by frontend after Firebase signIn (Google or Email)
 */
router.post("/", async (req, res) => {
  try {
    const { idToken, userAgent } = req.body;
    if (!idToken) return res.status(400).json({ message: "ID_TOKEN_REQUIRED" });

    // Verify ID token
    const decoded = await admin.auth().verifyIdToken(idToken, true);

    // Must exist in DB
    const existingUser = await prisma.user.findUnique({
      where: { email: decoded.email! },
    });
    if (!existingUser) {
      return res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "No account found. Please sign up first.",
      });
    }

    // Mirror verification state
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { emailVerified: decoded.email_verified ?? false },
    });

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: existingUser.id,
        ipAddress: req.ip ?? null,
        userAgent: userAgent ?? req.headers["user-agent"] ?? null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    // Create cookie
    const cookie = await makeSessionCookie(decoded.uid);
    res
      .cookie("__Secure-iventics_session", cookie, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      })
      .json({ status: "success" });
  } catch (err) {
    console.error("login-with-firebase error:", err);
    res.status(500).json({ message: "INTERNAL_ERROR" });
  }
});

export default router;
