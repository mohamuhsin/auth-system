import { Router, Request, Response, NextFunction } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";
import { logAudit } from "../../utils/audit";

const router = Router();

/**
 * 🔐 POST /api/auth/session
 * Exchanges Firebase ID token → Secure session cookie.
 * Creates a user if missing and delegates errors to the global errorHandler.
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

    // 🔧 Find or create user in Prisma
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email,
          name,
          avatarUrl,
          role: "USER",
        },
      });

      // 🧾 Audit: user creation
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

    // 🧾 Audit: successful login
    await logAudit("LOGIN", user.id, req.ip, req.headers["user-agent"]);

    // ✅ Respond
    res.status(200).json({
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
    // 🧾 Log the failed attempt (but don’t block next())
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
