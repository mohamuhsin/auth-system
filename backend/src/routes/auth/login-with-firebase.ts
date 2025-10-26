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
 * Updates user's verification status, records session + audit log.
 *
 * Frontend: called by loginWithEmailPassword() or Google login.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { idToken, userAgent } = req.body;

    if (!idToken) {
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
        message: "Invalid or expired token.",
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

    /* ============================================================
       👤 Find User
    ============================================================ */
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
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
       📧 Email verification check
    ============================================================ */
    if (!decoded.email_verified && !user.emailVerified) {
      await logAudit(
        AuditAction.USER_LOGIN,
        user.id,
        req.ip,
        req.headers["user-agent"],
        {
          reason: "UNVERIFIED_EMAIL",
        }
      );

      return res.status(403).json({
        status: "error",
        message: "Please verify your email before logging in.",
      });
    }

    // ✅ Sync Firebase email_verified to DB
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: decoded.email_verified ?? false },
    });

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
       🧾 Create session record (hashed token)
    ============================================================ */
    const session = await prisma.session.create({
      data: {
        tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
        userId: user.id,
        ipAddress: ip,
        userAgent: ua,
        expiresAt,
      },
    });

    /* ============================================================
       📤 Respond + Set-Cookie
    ============================================================ */
    res.setHeader("Set-Cookie", cookieHeader);
    res.status(200).json({
      status: "success",
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      sessionId: session.id,
      expiresAt,
    });

    /* ============================================================
       🧾 Audit log (async)
    ============================================================ */
    await logAudit(
      AuditAction.USER_LOGIN,
      user.id,
      req.ip,
      req.headers["user-agent"],
      {
        method: "FIREBASE",
        sessionId: session.id,
      }
    );

    logger.info(`✅ User ${user.email} logged in successfully`);
  } catch (err: any) {
    logger.error("🔥 Login-with-firebase failed:", err);
    await logAudit(
      AuditAction.USER_LOGIN,
      null,
      req.ip,
      req.headers["user-agent"],
      {
        reason: "ERROR",
        detail: err.message,
      }
    );

    return res.status(500).json({
      status: "error",
      message: "Something went wrong creating the session.",
    });
  }
});

export default router;
