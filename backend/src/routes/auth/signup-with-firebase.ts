// src/routes/auth/signup-with-firebase.ts
import { Router } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";

const router = Router();

/**
 * POST /api/auth/signup-with-firebase
 * Called by frontend when user signs up using Google for first time
 */
router.post("/", async (req, res) => {
  try {
    const { idToken, name, avatarUrl, userAgent } = req.body;
    if (!idToken) return res.status(400).json({ message: "ID_TOKEN_REQUIRED" });

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken, true);

    // Must NOT exist in DB
    const existing = await prisma.user.findUnique({
      where: { email: decoded.email! },
    });
    if (existing) {
      return res.status(409).json({
        code: "EMAIL_ALREADY_EXISTS",
        message: "Account already exists. Please sign in.",
      });
    }

    // Create new user record
    const newUser = await prisma.user.create({
      data: {
        firebaseUid: decoded.uid,
        email: decoded.email!,
        name: name ?? decoded.name ?? null,
        avatarUrl: avatarUrl ?? decoded.picture ?? null,
        emailVerified: decoded.email_verified ?? false,
        role: "USER",
      },
    });

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: newUser.id,
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
    console.error("signup-with-firebase error:", err);
    res.status(500).json({ message: "INTERNAL_ERROR" });
  }
});

export default router;
