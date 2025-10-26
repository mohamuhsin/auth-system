import { Router, Request, Response, NextFunction } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";
import { hashToken } from "../../utils/crypto";

const router = Router();

/**
 * 🔐 POST /api/auth/session
 * ------------------------------------------------------------
 * Exchanges a Firebase ID Token → Secure session cookie.
 * Enforces email verification (for password users).
 * Creates/links user and session record in DB.
 */
router.post("/", async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== "string") {
      return res
        .status(400)
        .json({ status: "error", message: "Missing idToken" });
    }

    console.log("🟢 Received ID token. Verifying via Firebase...");
    const decoded = await admin.auth().verifyIdToken(idToken, true);

    const provider = decoded.firebase?.sign_in_provider ?? "password";
    const email = decoded.email ?? "";
    const name = decoded.name ?? null;
    const avatarUrl = decoded.picture ?? null;

    // 🔐 Enforce email verification for password logins only
    if (provider === "password" && !decoded.email_verified) {
      console.warn(`⛔ Unverified email attempt: ${email}`);
      await logAudit(
        "USER_LOGIN",
        null,
        req.ip ?? null,
        req.headers["user-agent"] ?? null,
        { reason: "UNVERIFIED_EMAIL" }
      );

      return res.status(403).json({
        status: "error",
        message: "Please verify your email address before logging in.",
      });
    }

    // 🔍 Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ uid: decoded.uid }, { email }] },
    });

    if (!user) {
      console.log("🆕 Creating new user record...");
      const isFirstUser = (await prisma.user.count()) === 0;

      user = await prisma.user.create({
        data: {
          uid: decoded.uid,
          email,
          name,
          avatarUrl,
          emailVerified: decoded.email_verified,
          emailVerifiedAt: decoded.email_verified ? new Date() : null,
          primaryProvider: provider === "google.com" ? "GOOGLE" : "PASSWORD",
          role: isFirstUser ? "ADMIN" : "USER",
          isApproved: isFirstUser,
          lastLoginAt: new Date(),
        },
      });

      await logAudit(
        "USER_SIGNUP",
        user.id,
        req.ip ?? null,
        req.headers["user-agent"] ?? null
      );
    } else {
      // ✅ Update metadata if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          uid: user.uid || decoded.uid,
          emailVerified: decoded.email_verified,
          emailVerifiedAt: decoded.email_verified ? new Date() : null,
          lastLoginAt: new Date(),
          primaryProvider: provider === "google.com" ? "GOOGLE" : "PASSWORD",
        },
      });
    }

    // 🍪 Create secure session cookie (Firebase session cookie)
    console.log("🍪 Creating session cookie...");
    const { cookieHeader, rawToken, expiresAt } = await makeSessionCookie(
      idToken
    );

    // 💾 Save session in DB (store only hashed token)
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: await hashToken(rawToken),
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
        expiresAt,
      },
    });

    // ✅ Send cookie back to client
    res.setHeader("Set-Cookie", cookieHeader);
    console.log(`✅ Session cookie set for ${user.email}`);

    // 🧾 Audit successful login
    await logAudit(
      "USER_LOGIN",
      user.id,
      req.ip ?? null,
      req.headers["user-agent"] ?? null
    );

    return res.status(200).json({
      status: "success",
      message: "Session created successfully",
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err: any) {
    console.error("🚨 AUTH SESSION ERROR:", err);

    if (err.code === "P2002") {
      await logAudit(
        "USER_SIGNUP",
        null,
        req.ip ?? null,
        req.headers["user-agent"] ?? null,
        { reason: "DUPLICATE_EMAIL" }
      );
      return res.status(409).json({
        status: "error",
        message: "A user with this email already exists.",
      });
    }

    await logAudit(
      "USER_LOGIN",
      null,
      req.ip ?? null,
      req.headers["user-agent"] ?? null,
      { reason: err.message || "LOGIN_FAILED" }
    );

    return res.status(500).json({
      status: "error",
      message: err.message || "Internal server error",
    });
  }
});

export default router;
