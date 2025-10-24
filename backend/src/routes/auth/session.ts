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
 * Creates a user if missing.
 * Automatically makes the first registered user ADMIN.
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing idToken" });
    }

    // 🔎 Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email || "";
    const name = decoded.name || null;
    const avatarUrl = decoded.picture || null;

    // 🔧 Find or create user
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
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

    // 🍪 Create Firebase session cookie (value only)
    const sessionCookieValue = await makeSessionCookie(idToken);

    // ✅ Set secure cookie across *.iventics.com
    const cookieName =
      process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
    res.cookie(cookieName, sessionCookieValue, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? ".iventics.com" // shared across subdomains
          : "localhost", // local dev
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 🧾 Audit successful login
    await logAudit("LOGIN", user.id, req.ip, req.headers["user-agent"]);

    // ✅ Success response
    return res.status(200).json({
      status: "success",
      message: "Session created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error("❌ /api/auth/session error:", (err as Error).message);

    await logAudit(
      "LOGIN_FAILED",
      undefined,
      req.ip,
      req.headers["user-agent"]
    );

    return res.status(500).json({
      status: "error",
      message: (err as Error).message || "Internal Server Error",
    });
  }
});

export default router;
