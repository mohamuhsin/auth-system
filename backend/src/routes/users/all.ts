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
      const error = new Error("Missing idToken");
      (error as any).status = 400;
      throw error;
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
          isApproved: isFirstUser, // Auto-approved admin
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
    res.setHeader("Set-Cookie", cookie);

    // 🧾 Audit successful login
    await logAudit("LOGIN", user.id, req.ip, req.headers["user-agent"]);

    // ✅ Unified response
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
  } catch (err: any) {
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
