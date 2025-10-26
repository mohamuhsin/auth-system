import { Router } from "express";
import { authGuard, AuthenticatedRequest } from "../../middleware/authGuard";
import { logAudit } from "../../utils/audit";
import { AuditAction } from "@prisma/client";

const router = Router();

/**
 * 👤 GET /api/users/me
 * ------------------------------------------------------------
 * Returns the authenticated user's profile based on the verified session.
 * Uses merged Firebase + DB data (authGuard attaches req.authUser).
 */
router.get("/", authGuard(), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.authUser;

    if (!user) {
      await logAudit(
        AuditAction.USER_LOGIN,
        null,
        req.ip,
        req.headers["user-agent"],
        {
          reason: "NO_AUTH_USER",
        }
      );

      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Not authenticated",
      });
    }

    // 🧾 Record audit log for profile view
    await logAudit(
      AuditAction.USER_UPDATE, // Re-use USER_UPDATE to represent profile view/read
      user.id,
      req.ip,
      req.headers["user-agent"],
      { action: "PROFILE_VIEW" }
    );

    // ✅ Unified user profile response
    return res.status(200).json({
      status: "success",
      code: 200,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        role: user.role,
        name: user.name ?? null,
        avatarUrl: user.avatarUrl ?? user.photoURL ?? null,
        isApproved: user.isApproved,
      },
    });
  } catch (err: any) {
    console.error("User profile error:", err.message);

    await logAudit(
      AuditAction.USER_UPDATE,
      null,
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
      message: "Failed to fetch profile",
    });
  }
});

export default router;
