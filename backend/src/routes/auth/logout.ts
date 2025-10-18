import { Router } from "express";
import admin from "../../services/firebaseAdmin";
import { clearSessionCookie } from "../../utils/cookies";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const cookieName =
      process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
    const cookie = req.cookies?.[cookieName];
    if (cookie) {
      try {
        const decoded = await admin.auth().verifySessionCookie(cookie, true);
        await admin.auth().revokeRefreshTokens(decoded.sub);
      } catch {
        console.warn("Logout: invalid or expired cookie");
      }
    }

    res.setHeader("Set-Cookie", clearSessionCookie());
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err: any) {
    console.error("Logout error:", err.message);
    res.status(500).json({ message: "Logout failed" });
  }
});

export default router;
