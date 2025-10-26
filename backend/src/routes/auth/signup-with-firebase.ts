import { Router, Request, Response } from "express";
import crypto from "crypto";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";
import { AuditAction, Role } from "@prisma/client";
import { logger } from "../../utils/logger";

const router = Router();

/**
 * 🆕 POST /api/auth/signup-with-firebase
 * ------------------------------------------------------------
 * Verifies Firebase ID token → creates new user → issues session cookie.
 * Auto-assigns ADMIN to first user; logs audit trail.
 *
 * Frontend calls this after Firebase signup (Email/Password or Google).
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { idToken, name, avatarUrl, userAgent } = req.body;

    if (!idToken) {
      logger.warn("🚫 Missing ID token during signup");
      return res.status(400).json({
        status: "error",
        message: "Missing ID token.",
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
        AuditAction.USER_SIGNUP,
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
        message: "Invalid or expired token.",
      });
    }

    const email = decoded.email;
    if (!email) {
      await logAudit(
        AuditAction.USER_SIGNUP,
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

    /* ============================================================
       🔎 Check for existing account
    ============================================================ */
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await logAudit(
        AuditAction.USER_SIGNUP,
        existing.id,
        req.ip,
        req.headers["user-agent"],
        {
          reason: "ACCOUNT_EXISTS",
        }
      );

      return res.status(409).json({
        status: "error",
        message: "Account already exists. Please log in.",
      });
    }

    /* ============================================================
       👑 Determine role (first user → ADMIN)
    ============================================================ */
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;
    const assignedRole = isFirstUser ? Role.ADMIN : Role.USER;

    /* ============================================================
       🧩 Create new user record
    ============================================================ */
    const provider = decoded.firebase?.sign_in_provider || "firebase";
    const newUser = await prisma.user.create({
      data: {
        uid: decoded.uid,
        email,
        name: name ?? decoded.name ?? null,
        avatarUrl: avatarUrl ?? decoded.picture ?? null,
        emailVerified: decoded.email_verified ?? false,
        role: assignedRole,
        isApproved: isFirstUser,
      },
    });

    logger.info(
      `✅ New user created: ${newUser.email} (${assignedRole}) [verified=${newUser.emailVerified}] [provider=${provider}]`
    );

    await logAudit(
      AuditAction.USER_SIGNUP,
      newUser.id,
      req.ip,
      req.headers["user-agent"],
      {
        provider,
        role: assignedRole,
      }
    );

    /* ============================================================
       ⚠️ If email not verified (Email/Password signup)
       → don't auto-login; return special flag.
    ============================================================ */
    if (!decoded.email_verified && provider === "password") {
      logger.info(`📧 Email signup pending verification: ${newUser.email}`);
      return res.status(202).json({
        status: "pending_verification",
        message: "Account created. Please verify your email before logging in.",
      });
    }

    /* ============================================================
       🍪 Create secure session cookie (Google or verified email)
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
       💾 Create session record (hashed)
    ============================================================ */
    const session = await prisma.session.create({
      data: {
        tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
        userId: newUser.id,
        ipAddress: ip,
        userAgent: ua,
        expiresAt,
      },
    });

    /* ============================================================
       📤 Respond + Set-Cookie
    ============================================================ */
    res.setHeader("Set-Cookie", cookieHeader);
    res.status(201).json({
      status: "success",
      message: "User created and logged in successfully.",
      user: {
        id: newUser.id,
        firebaseUid: newUser.uid,
        email: newUser.email,
        name: newUser.name,
        avatarUrl: newUser.avatarUrl,
        role: newUser.role,
        isApproved: newUser.isApproved,
      },
      sessionId: session.id,
      expiresAt,
    });

    logger.info(
      `🍪 Session created for ${newUser.email} (sessionId=${session.id})`
    );
  } catch (err: any) {
    logger.error("🔥 signup-with-firebase failed:", err);

    await logAudit(
      AuditAction.USER_SIGNUP,
      null,
      req.ip,
      req.headers["user-agent"],
      {
        reason: "SERVER_ERROR",
        detail: err.message,
      }
    );

    res.status(500).json({
      status: "error",
      message: "Internal server error during signup.",
    });
  }
});

export default router;
