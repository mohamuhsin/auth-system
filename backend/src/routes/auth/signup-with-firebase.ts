import { Router } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";

const router = Router();

/**
 * 🔐 POST /api/auth/signup-with-firebase
 * Called by frontend when user signs up using Google for the first time
 */
router.post("/", async (req, res) => {
  try {
    const { idToken, name, avatarUrl, userAgent } = req.body;

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

    // ✅ Ensure user does not already exist
    const existing = await prisma.user.findUnique({
      where: { email: decoded.email! },
    });

    if (existing) {
      return res.status(409).json({
        code: "EMAIL_ALREADY_EXISTS",
        message: "Account already exists. Please sign in instead.",
      });
    }

    // ✅ Create new user
    const newUser = await prisma.user.create({
      data: {
        firebaseUid: decoded.uid,
        email: decoded.email!,
        name: name ?? decoded.name ?? null,
        avatarUrl: avatarUrl ?? decoded.picture ?? null,
        // Removed emailVerified because your schema doesn't include it
        role: "USER",
      },
    });

    // ✅ Create session
    const session = await prisma.session.create({
      data: {
        userId: newUser.id,
        ipAddress:
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          null,
        userAgent: userAgent ?? req.headers["user-agent"] ?? null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    // ✅ Create secure cross-domain cookie
    const cookie = await makeSessionCookie(decoded.uid);

    res
      .cookie("__Secure-iventics_session", cookie, {
        httpOnly: true,
        secure: true,
        sameSite: "none", // ✅ required for auth.iventics.com <-> auth-api.iventics.com
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
      .status(201)
      .json({
        status: "success",
        message: "User created successfully",
        userId: newUser.id,
        sessionId: session.id,
      });
  } catch (err) {
    console.error("🔥 signup-with-firebase error:", err);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Something went wrong creating the user",
    });
  }
});

export default router;
