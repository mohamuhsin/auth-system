import { Router } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { clearSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";

const router = Router();

/**
 * 🔐 POST /api/auth/logout
 * ------------------------------------------------------------
 * Revokes the Firebase session cookie and clears it from the client.
 * Records audit logs for all possible outcomes.
 */
router.post("/", async (req, res) => {
  try {
    const cookieName =
      process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
    const cookie = req.cookies?.[cookieName];

    if (cookie) {
      try {
        // 🔍 Verify and revoke Firebase session
        const decoded = await admin.auth().verifySessionCookie(cookie, true);
        await admin.auth().revokeRefreshTokens(decoded.sub);

        // 🧩 Map Firebase UID → internal DB ID
        const dbUser = await prisma.user.findUnique({
          where: { uid: decoded.uid },
        });

        await logAudit("LOGOUT", dbUser?.id, req.ip, req.headers["user-agent"]);
      } catch (err: any) {
        console.warn("Logout: invalid or expired cookie");

        await logAudit(
          "LOGOUT_FAILED",
          undefined,
          req.ip,
          req.headers["user-agent"]
        );
      }
    } else {
      await logAudit(
        "LOGOUT_NO_COOKIE",
        undefined,
        req.ip,
        req.headers["user-agent"]
      );
    }

    // 🍪 Clear cookie from client
    res.setHeader("Set-Cookie", clearSessionCookie());

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (err: any) {
    console.error("Logout error:", err.message);

    await logAudit(
      "LOGOUT_ERROR",
      undefined,
      req.ip,
      req.headers["user-agent"]
    );

    return res.status(500).json({
      status: "error",
      message: "Logout failed",
    });
  }
});

export default router;
