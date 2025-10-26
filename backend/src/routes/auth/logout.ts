import { Router } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { clearSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";
import { AuditAction } from "@prisma/client";

const router = Router();

/**
 * POST /api/auth/logout
 * Revokes Firebase cookie and clears it from the browser.
 */
router.post("/", async (req, res) => {
  try {
    const cookieName =
      process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
    const cookie = req.cookies?.[cookieName];

    if (cookie) {
      try {
        const decoded = await admin.auth().verifySessionCookie(cookie, true);
        await admin.auth().revokeRefreshTokens(decoded.sub);

        const dbUser = await prisma.user.findUnique({
          where: { uid: decoded.uid },
        });
        await logAudit(
          AuditAction.USER_LOGOUT,
          dbUser?.id ?? null,
          req.ip,
          req.headers["user-agent"]
        );
      } catch {
        await logAudit(
          AuditAction.USER_LOGOUT_FAILED,
          null,
          req.ip,
          req.headers["user-agent"]
        );
      }
    } else {
      await logAudit(
        AuditAction.USER_LOGOUT_NO_COOKIE,
        null,
        req.ip,
        req.headers["user-agent"]
      );
    }

    res.setHeader("Set-Cookie", clearSessionCookie());
    res
      .status(200)
      .json({ status: "success", message: "Logged out successfully" });
  } catch (err: any) {
    await logAudit(
      AuditAction.USER_LOGOUT_ERROR,
      null,
      req.ip,
      req.headers["user-agent"],
      {
        reason: "ERROR",
        detail: err.message,
      }
    );
    res.status(500).json({ status: "error", message: "Logout failed" });
  }
});

export default router;
