import { Router, Request, Response } from "express";
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
router.post("/", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        status: "error",
        message: "Missing idToken",
      });
    }

    // 🔎 Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken, true);
    const email = decoded.email || "";
    const name = decoded.name || null;
    const avatarUrl = decoded.picture || null;

    // 🚫 Reject unverified email users (non-OAuth signups)
    if (!decoded.email_verified) {
      await logAudit(
        "LOGIN_REJECTED_UNVERIFIED",
        undefined,
        req.ip,
        req.headers["user-agent"]
      );
      return res.status(403).json({
        status: "error",
        message: "Please verify your email before logging in.",
      });
    }

    // 🔧 Check if user exists
    let user = await prisma.user.findUnique({
      where: { uid: decoded.uid }, // ✅ updated field
    });

    // 🆕 Create user if not found
    if (!user) {
      const userCount = await prisma.user.count();
      const isFirstUser = userCount === 0;

      user = await prisma.user.create({
        data: {
          uid: decoded.uid, // ✅ synced with schema
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
    const cookieHeader = await makeSessionCookie(idToken);
    res.setHeader("Set-Cookie", cookieHeader);

    // 🧾 Audit successful login
    await logAudit("LOGIN", user.id, req.ip, req.headers["user-agent"]);

    // ✅ Unified response
    return res.status(200).json({
      status: "success",
      message: "Session created successfully",
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err: any) {
    console.error("🚨 AUTH SESSION ERROR:", err.message);
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
