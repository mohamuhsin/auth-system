import { Router } from "express";
import { authGuard, AuthenticatedRequest } from "../../middleware/authGuard";
import { logAudit } from "../../utils/audit";
import { AuditAction } from "@prisma/client";
import { logger } from "../../utils/logger";

const router = Router();

/**
 * 👤 GET /api/users/me
 * ------------------------------------------------------------
 * Returns the authenticated user's profile from the verified session.
 * Relies on `authGuard()` to attach merged Firebase + DB user data.
 */
router.get("/", authGuard(), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.authUser;

    // 🚫 No valid user context found
    if (!user) {
      logger.warn("No authenticated user found for /users/me");

      await logAudit(
        AuditAction.USER_LOGIN,
        null,
        req.ip,
        req.headers["user-agent"],
        { reason: "NO_AUTH_USER" }
      );

      return res.status(401).json({
        status: "error",
        code: 401,
        message: "No valid session found. Please log in again.",
      });
    }

    // 🧾 Record audit log for profile access (treated as safe read)
    await logAudit(
      AuditAction.USER_UPDATE,
      user.id,
      req.ip,
      req.headers["user-agent"],
      {
        event: "PROFILE_VIEW",
        description: "User accessed their profile",
      }
    );

    // ✅ Respond with unified profile structure (matches frontend AuthContext)
    return res.status(200).json({
      status: "success",
      code: 200,
      id: user.id,
      uid: user.uid,
      email: user.email,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? user.photoURL ?? null,
      role: user.role,
      isApproved: user.isApproved ?? false,
    });
  } catch (err: any) {
    logger.error({
      msg: "❌ /users/me error",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });

    await logAudit(
      AuditAction.USER_UPDATE,
      req.authUser?.id ?? null,
      req.ip,
      req.headers["user-agent"],
      {
        reason: "PROFILE_FETCH_ERROR",
        detail: err.message,
      }
    );

    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Failed to fetch user profile.",
    });
  }
});

export default router;
