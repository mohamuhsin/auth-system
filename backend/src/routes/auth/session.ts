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
 * Enforces email verification before session creation.
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      console.error("❌ Missing idToken in request body");
      return res
        .status(400)
        .json({ status: "error", message: "Missing idToken" });
    }

    console.log("🟢 Received idToken. Verifying...");
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log("✅ Token verified for UID:", decoded.uid);

    // 🚫 Reject unverified email users (non-OAuth signups)
    if (!decoded.email_verified) {
      console.warn(`⛔ Unverified email attempt: ${decoded.email}`);
      await logAudit(
        "LOGIN_REJECTED_UNVERIFIED",
        undefined,
        req.ip,
        req.headers["user-agent"]
      );
      return res.status(403).json({
        status: "error",
        message: "Please verify your email address before logging in.",
      });
    }

    const email = decoded.email || "";
    const name = decoded.name || null;
    const avatarUrl = decoded.picture || null;

    // 🔍 Find user by Firebase UID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid: decoded.uid }, { email }],
      },
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
    } else if (!user.firebaseUid) {
      console.log("🔗 Linking existing user to Firebase UID...");
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid: decoded.uid },
      });
    }

    // 🍪 Create secure session cookie
    console.log("🍪 Creating session cookie...");
    const cookieHeader = await makeSessionCookie(idToken);
    res.setHeader("Set-Cookie", cookieHeader);
    console.log(`✅ Session cookie set for ${user.email}`);

    // 🧾 Record successful login
    await logAudit("LOGIN", user.id, req.ip, req.headers["user-agent"]);

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
  } catch (err: any) {
    console.error("🚨 AUTH SESSION ERROR:", err.message);
    console.error(err);

    if (err.code === "P2002") {
      await logAudit(
        "USER_DUPLICATE_EMAIL",
        undefined,
        req.ip,
        req.headers["user-agent"]
      );
      return res.status(409).json({
        status: "error",
        message: "A user with this email already exists.",
      });
    }

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
