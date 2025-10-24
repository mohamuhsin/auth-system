import { Router } from "express";
import admin from "../../services/firebaseAdmin";
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
        // 🔍 Verify and revoke the Firebase session
        const decoded = await admin.auth().verifySessionCookie(cookie, true);
        await admin.auth().revokeRefreshTokens(decoded.sub);

        // 🧾 Record successful logout
        await logAudit(
          "LOGOUT",
          decoded.uid,
          req.ip,
          req.headers["user-agent"]
        );
      } catch (err: any) {
        console.warn("Logout: invalid or expired cookie");

        // 🧾 Record failed logout attempt
        await logAudit(
          "LOGOUT_FAILED",
          undefined,
          req.ip,
          req.headers["user-agent"]
        );
      }
    } else {
      // 🧾 No cookie found (possible direct API call)
      await logAudit(
        "LOGOUT_NO_COOKIE",
        undefined,
        req.ip,
        req.headers["user-agent"]
      );
    }

    // 🍪 Clear the cookie from the client
    res.setHeader("Set-Cookie", clearSessionCookie());

    // ✅ Unified success response
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (err: any) {
    console.error("Logout error:", err.message);

    // 🧾 Log unexpected server-side errors
    await logAudit(
      "LOGOUT_ERROR",
      undefined,
      req.ip,
      req.headers["user-agent"]
    );

    res.status(500).json({
      status: "error",
      message: "Logout failed",
    });
  }
});

export default router;
