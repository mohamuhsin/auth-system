import { Router, Request, Response } from "express";
import crypto from "crypto";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";
import { AuditAction, Role } from "@prisma/client";
import { logger } from "../../utils/logger";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { idToken, userAgent } = req.body;

    if (!idToken || typeof idToken !== "string") {
      logger.warn("Missing idToken in /auth/session");
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Missing or invalid idToken",
      });
    }

    const decoded = await admin.auth().verifyIdToken(idToken, true);
    const email = decoded.email ?? null;
    const name = decoded.name ?? null;
    const avatarUrl = decoded.picture ?? null;

    if (!email) {
      await logAudit(
        AuditAction.USER_LOGIN,
        null,
        req.ip,
        req.headers["user-agent"],
        { reason: "NO_EMAIL_IN_TOKEN" }
      );
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Firebase token missing email field.",
      });
    }

    if (
      !decoded.email_verified &&
      decoded.firebase?.sign_in_provider === "password"
    ) {
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

    let user = await prisma.user.findUnique({ where: { uid: decoded.uid } });
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    if (!user) {
      user = await prisma.user.create({
        data: {
          uid: decoded.uid,
          email,
          name,
          avatarUrl,
          role: isFirstUser ? Role.ADMIN : Role.USER,
          isApproved: isFirstUser,
          emailVerified: decoded.email_verified ?? false,
        },
      });

      await logAudit(
        AuditAction.USER_SIGNUP,
        user.id,
        req.ip,
        req.headers["user-agent"],
        { reason: "NEW_USER_AUTO_CREATED" }
      );

      logger.info(`New user created: ${user.email}`);
    } else {
      await logAudit(
        AuditAction.USER_LOGIN,
        user.id,
        req.ip,
        req.headers["user-agent"],
        { reason: "EXISTING_USER_SESSION" }
      );
    }

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

    await prisma.session.create({
      data: {
        tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
        userId: user.id,
        ipAddress: ip,
        userAgent: ua,
        expiresAt,
      },
    });

    res.setHeader("Set-Cookie", cookieHeader);
    logger.info(`Session created for ${email}`);

    return res.status(200).json({
      status: "success",
      code: 200,
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
    logger.error({
      msg: "🚨 /auth/session error",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });

    await logAudit(
      AuditAction.USER_LOGIN,
      null,
      req.ip,
      req.headers["user-agent"],
      { reason: "SESSION_CREATION_ERROR", detail: err.message }
    );

    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Failed to create session.",
      ...(process.env.NODE_ENV !== "production" && { detail: err.message }),
    });
  }
});

export default router;
