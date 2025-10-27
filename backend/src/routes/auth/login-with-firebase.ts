import { Router, Request, Response } from "express";
import crypto from "crypto";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";
import { AuditAction } from "@prisma/client";
import { logger } from "../../utils/logger";

const router = Router();

/**
 * 🔐 POST /api/auth/login-with-firebase
 * ------------------------------------------------------------
 * Verifies Firebase ID token → issues secure session cookie.
 * Updates verification status, records session & audit log.
 * Supports both Google and Email/Password sign-ins.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { idToken, userAgent } = req.body;

    if (!idToken || typeof idToken !== "string") {
      logger.warn("🚫 Missing ID token in login request");
      return res.status(400).json({
        status: "error",
        message: "Missing ID token",
      });
    }

    /* ============================================================
       🔍 Verify Firebase token
    ============================================================ */
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken, true);
    } catch (verifyErr: any) {
      logger.warn("⚠️ Invalid Firebase token:", verifyErr.message);
      await logAudit(
        AuditAction.USER_LOGIN,
        null,
        req.ip,
        req.headers["user-agent"],
        {
          reason: "INVALID_TOKEN",
          detail: verifyErr.message,
        }
      );
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired Firebase token.",
      });
    }

    const email = decoded.email;
    if (!email) {
      await logAudit(
        AuditAction.USER_LOGIN,
        null,
        req.ip,
        req.headers["user-agent"],
        {
          reason: "NO_EMAIL_IN_TOKEN",
        }
      );
      return res.status(400).json({
        status: "error",
        message: "Token missing email field.",
      });
    }

    const provider = decoded.firebase?.sign_in_provider ?? "password";

    /* ============================================================
       👤 Find user in DB
    ============================================================ */
    let user = await prisma.user.findUnique({ where: { email } });

    // 🔸 No existing user → instruct frontend to sign up
    if (!user) {
      logger.warn(`❌ Login failed — no user found for ${email}`);
      await logAudit(
        AuditAction.USER_LOGIN,
        null,
        req.ip,
        req.headers["user-agent"],
        {
          reason: "USER_NOT_FOUND",
          email,
        }
      );
      return res.status(404).json({
        status: "error",
        message: "Account not found.",
      });
    }

    /* ============================================================
       📧 Enforce email verification for password logins
    ============================================================ */
    if (
      provider === "password" &&
      !decoded.email_verified &&
      !user.emailVerified
    ) {
      await logAudit(
        AuditAction.USER_LOGIN,
        user.id,
        req.ip,
        req.headers["user-agent"],
        {
          reason: "UNVERIFIED_EMAIL",
        }
      );
      logger.warn(`🚫 Unverified email login attempt: ${user.email}`);
      return res.status(403).json({
        status: "error",
        message: "Please verify your email before logging in.",
      });
    }

    /* ============================================================
       🔄 Sync verification + metadata
    ============================================================ */
    const updates: any = {
      lastLoginAt: new Date(),
      emailVerified: decoded.email_verified,
      emailVerifiedAt: decoded.email_verified
        ? new Date()
        : user.emailVerifiedAt,
      primaryProvider: provider === "google.com" ? "GOOGLE" : "PASSWORD",
      status: "ACTIVE",
    };
    user = await prisma.user.update({ where: { id: user.id }, data: updates });

    /* ============================================================
       🍪 Create secure session cookie
    ============================================================ */
    const { cookieHeader, rawToken, expiresAt } = await makeSessionCookie(
      idToken
    );

    const ua =
      (Array.isArray(userAgent) ? userAgent.join("; ") : userAgent) ??
      req.headers["user-agent"] ??
      null;

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;

    /* ============================================================
       🧾 Save new session record (hashed token)
    ============================================================ */
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
        ipAddress: ip,
        userAgent: ua,
        expiresAt,
      },
    });

    /* ============================================================
       📤 Send cookie + response
    ============================================================ */
    res.setHeader("Set-Cookie", cookieHeader);
    res.status(200).json({
      status: "success",
      message: "Login successful",
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
      sessionId: session.id,
      expiresAt,
    });

    /* ============================================================
       🧾 Async audit log
    ============================================================ */
    await logAudit(
      AuditAction.USER_LOGIN,
      user.id,
      req.ip,
      req.headers["user-agent"],
      {
        method: provider,
        sessionId: session.id,
      }
    );

    logger.info(`✅ User ${user.email} logged in successfully`);
  } catch (err: any) {
    logger.error("🔥 login-with-firebase failed:", err);
    await logAudit(
      AuditAction.USER_LOGIN,
      null,
      req.ip,
      req.headers["user-agent"],
      {
        reason: "SERVER_ERROR",
        detail: err.message,
      }
    );
    return res.status(500).json({
      status: "error",
      message: "Internal server error during login.",
    });
  }
});

export default router;
