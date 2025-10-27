import { Router, Request, Response } from "express";
import crypto from "crypto";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { clearSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";
import { AuditAction } from "@prisma/client";
import { logger } from "../../utils/logger";

const router = Router();

/**
 * 🚪 POST /api/auth/logout
 * ------------------------------------------------------------
 * Revokes Firebase session cookie + clears it from browser.
 * Deletes DB session, logs audit, and handles all edge cases.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const cookieName =
      process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
    const cookie = req.cookies?.[cookieName];

    // 🔸 If no cookie — log event & still return success (idempotent)
    if (!cookie) {
      logger.warn("🚫 Logout called with no session cookie present.");
      await logAudit(
        AuditAction.USER_LOGOUT_NO_COOKIE,
        null,
        req.ip,
        req.headers["user-agent"]
      );
      res.setHeader("Set-Cookie", clearSessionCookie());
      return res
        .status(200)
        .json({ status: "success", message: "Logged out (no active session)" });
    }

    // ============================================================
    // 🔍 Verify and revoke Firebase session cookie
    // ============================================================
    try {
      const decoded = await admin.auth().verifySessionCookie(cookie, true);
      const uid = decoded.uid;
      const sub = decoded.sub;

      // Revoke Firebase refresh tokens for that user (security)
      await admin.auth().revokeRefreshTokens(sub);

      // Delete DB session (by hashed cookie)
      const tokenHash = crypto
        .createHash("sha256")
        .update(cookie)
        .digest("hex");
      await prisma.session.deleteMany({ where: { tokenHash } });

      // Audit log
      const dbUser = await prisma.user.findUnique({ where: { uid } });
      await logAudit(
        AuditAction.USER_LOGOUT,
        dbUser?.id ?? null,
        req.ip,
        req.headers["user-agent"]
      );

      logger.info(`✅ User ${dbUser?.email || uid} logged out successfully.`);
    } catch (verifyErr: any) {
      logger.warn("⚠️ Logout token verification failed:", verifyErr.message);
      await logAudit(
        AuditAction.USER_LOGOUT_FAILED,
        null,
        req.ip,
        req.headers["user-agent"],
        {
          reason: "INVALID_OR_EXPIRED_COOKIE",
          detail: verifyErr.message,
        }
      );
    }

    // ============================================================
    // 🍪 Clear cookie across all subdomains
    // ============================================================
    res.setHeader("Set-Cookie", clearSessionCookie());

    return res
      .status(200)
      .json({ status: "success", message: "Logged out successfully" });
  } catch (err: any) {
    logger.error("🔥 Logout route failed:", err);

    await logAudit(
      AuditAction.USER_LOGOUT_ERROR,
      null,
      req.ip,
      req.headers["user-agent"],
      {
        reason: "SERVER_ERROR",
        detail: err.message,
      }
    );

    return res
      .status(500)
      .json({ status: "error", message: "Logout failed. Please try again." });
  }
});

export default router;
