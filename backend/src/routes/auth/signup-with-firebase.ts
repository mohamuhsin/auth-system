import { Router } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";

const router = Router();

/**
 * 🔐 POST /api/auth/signup-with-firebase
 * ------------------------------------------------------------
 * Handles first-time signups using Google/Firebase.
 * Creates user in DB, logs audit, and issues session cookie.
 */
router.post("/", async (req, res) => {
  try {
    const { idToken, name, avatarUrl, userAgent } = req.body;

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
      await logAudit(
        "SIGNUP_INVALID_TOKEN",
        undefined,
        req.ip,
        req.headers["user-agent"]
      );
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    const email = decoded.email!;
    const displayName = name ?? decoded.name ?? null;
    const picture = avatarUrl ?? decoded.picture ?? null;

    // 🚫 Prevent duplicate accounts
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await logAudit(
        "SIGNUP_EMAIL_EXISTS",
        existing.id,
        req.ip,
        req.headers["user-agent"]
      );
      return res.status(409).json({
        status: "error",
        message: "Account already exists. Please sign in instead.",
      });
    }

    // 🆕 Create new user (auto-admin for first account)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    const newUser = await prisma.user.create({
      data: {
        uid: decoded.uid,
        email,
        name: displayName,
        avatarUrl: picture,
        emailVerified: decoded.email_verified ?? false,
        role: isFirstUser ? "ADMIN" : "USER",
        isApproved: isFirstUser,
      },
    });

    await logAudit(
      "USER_CREATED",
      newUser.id,
      req.ip,
      req.headers["user-agent"]
    );

    // 🧾 Create session record
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

    // 🍪 Create secure Firebase session cookie
    const cookieValue = await makeSessionCookie(idToken);

    res
      .cookie("__Secure-iventics_session", cookieValue, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        domain: process.env.COOKIE_DOMAIN || ".iventics.com", // ✅ from env
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
      .status(201)
      .json({
        status: "success",
        message: "User created successfully",
        user: {
          id: newUser.id,
          uid: newUser.uid,
          email: newUser.email,
          name: newUser.name,
          avatarUrl: newUser.avatarUrl,
          role: newUser.role,
          isApproved: newUser.isApproved,
        },
        sessionId: session.id,
      });
  } catch (err: any) {
    console.error("🔥 signup-with-firebase error:", err.message);
    await logAudit(
      "SIGNUP_WITH_FIREBASE_ERROR",
      undefined,
      req.ip,
      req.headers["user-agent"]
    );

    return res.status(500).json({
      status: "error",
      message: "Something went wrong creating the user",
    });
  }
});

export default router;
