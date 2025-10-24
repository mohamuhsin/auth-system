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
      return res.status(400).json({ error: "Missing idToken" });
    }

    // 🔎 Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email || "";
    const name = decoded.name || null;
    const avatarUrl = decoded.picture || null;

    // 🔧 Check if user exists
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    // 🆕 Create user if not found
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

    // 🍪 Create secure session cookie
    const cookie = await makeSessionCookie(idToken);

    // ✅ Set cookie manually with full control for cross-domain
    res.cookie("__Secure-iventics_session", cookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? ".iventics.com" // 🔒 shared across subdomains
          : "localhost", // 🔧 for local testing
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 🧾 Audit successful login
    await logAudit("LOGIN", user.id, req.ip, req.headers["user-agent"]);

    // ✅ Response
    res.status(200).json({
      status: "success",
      message: "Session created",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    // 🧾 Log failed attempt (non-blocking)
    await logAudit(
      "LOGIN_FAILED",
      undefined,
      req.ip,
      req.headers["user-agent"]
    );
    next(err);
  }
});

export default router;
