import { Router, Request, Response } from "express";
import crypto from "crypto";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";
import { AuditAction, Role } from "@prisma/client";

const router = Router();

/**
 * 🔐 POST /api/auth/session
 * ------------------------------------------------------------
 * Exchanges Firebase ID token → Secure session cookie.
 * Creates a user if missing.
 * First registered user becomes ADMIN automatically.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { idToken, userAgent } = req.body;
    if (!idToken) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Missing idToken",
      });
    }

    // 🔎 Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken, true);
    const email = decoded.email!;
    const name = decoded.name || null;
    const avatarUrl = decoded.picture || null;

    // 🚫 Reject unverified email users (non-OAuth signups)
    if (!decoded.email_verified) {
      await logAudit(
        AuditAction.USER_LOGIN,
        null,
        req.ip,
        req.headers["user-agent"],
        { reason: "EMAIL_UNVERIFIED", email }
      );
      return res.status(403).json({
        status: "error",
        code: 403,
        message: "Please verify your email before logging in.",
      });
    }

    // 🔧 Find or create user
    let user = await prisma.user.findUnique({ where: { uid: decoded.uid } });

    if (!user) {
      const userCount = await prisma.user.count();
      const isFirstUser = userCount === 0;

      user = await prisma.user.create({
        data: {
          uid: decoded.uid,
          email,
          name,
          avatarUrl,
          role: isFirstUser ? Role.ADMIN : Role.USER,
          isApproved: isFirstUser,
          emailVerified: true,
        },
      });

      await logAudit(
        AuditAction.USER_SIGNUP,
        user.id,
        req.ip,
        req.headers["user-agent"],
        { reason: "NEW_USER" }
      );
    } else {
      await logAudit(
        AuditAction.USER_LOGIN,
        user.id,
        req.ip,
        req.headers["user-agent"],
        { reason: "EXISTING_USER" }
      );
    }

    // 🍪 Create Firebase session cookie
    const { cookieHeader, rawToken, expiresAt } = await makeSessionCookie(
      idToken
    );

    // 🧾 Store hashed token in DB
    const ua =
      (Array.isArray(userAgent) ? userAgent.join("; ") : userAgent) ??
      req.headers["user-agent"] ??
      null;

    await prisma.session.create({
      data: {
        tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
        userId: user.id,
        ipAddress:
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          null,
        userAgent: ua,
        expiresAt,
      },
    });

    // ✅ Send secure cookie
    res.setHeader("Set-Cookie", cookieHeader);

    // ✅ Success response
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
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err: any) {
    await logAudit(
      AuditAction.USER_LOGIN,
      null,
      req.ip,
      req.headers["user-agent"],
      { reason: "ERROR", detail: err.message }
    );

    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Failed to create session",
      detail: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
});

export default router;
