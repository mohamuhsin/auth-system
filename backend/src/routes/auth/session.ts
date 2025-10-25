import { Router, Request, Response, NextFunction } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";

const router = Router();

/**
 * 🔐 POST /api/auth/session
 * ------------------------------------------------------------
 * Exchanges Firebase ID token → Secure session cookie.
 * Creates user if missing, sets cookie, returns user info.
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      console.error("❌ No idToken in body");
      return res.status(400).json({ error: "Missing idToken" });
    }

    console.log("🟢 Received idToken. Verifying...");

    // Verify token
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log("✅ Token verified for UID:", decoded.uid);

    const email = decoded.email || "";
    const name = decoded.name || null;
    const avatarUrl = decoded.picture || null;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      console.log("🆕 Creating new user...");
      const userCount = await prisma.user.count();
      const isFirstUser = userCount === 0;

      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email,
          name,
          avatarUrl,
          role: isFirstUser ? "ADMIN" : "USER",
          isApproved: isFirstUser,
        },
      });

      await logAudit(
        "USER_CREATED",
        user.id,
        req.ip,
        req.headers["user-agent"]
      );
    }

    console.log("🍪 Creating session cookie...");
    const cookieHeader = await makeSessionCookie(idToken);

    // IMPORTANT: if makeSessionCookie returns serialized cookie string
    res.setHeader("Set-Cookie", cookieHeader);

    console.log("✅ Session cookie set for:", user.email);

    await logAudit("LOGIN", user.id, req.ip, req.headers["user-agent"]);

    return res.status(200).json({
      status: "success",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err: any) {
    console.error("🚨 AUTH SESSION ERROR:", err.message);
    console.error(err);

    await logAudit(
      "LOGIN_FAILED",
      undefined,
      req.ip,
      req.headers["user-agent"]
    );

    return res.status(500).json({
      status: "error",
      message: err.message || "Internal server error",
    });
  }
});

export default router;
