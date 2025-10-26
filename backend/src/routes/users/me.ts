import { Router } from "express";
import { authGuard, AuthenticatedRequest } from "../../middleware/authGuard";
import { logAudit } from "../../utils/audit";
import { AuditAction } from "@prisma/client";

const router = Router();

/**
 * 👤 GET /api/users/me
 * ------------------------------------------------------------
 * Returns authenticated user's profile based on verified session.
 * Uses merged Firebase + DB data (attached by authGuard).
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
        { reason: "NO_AUTH_USER" }
      );

      return res.status(401).json({
        status: "error",
        code: 401,
        message: "No valid session cookie found.",
      });
    }

    // 🧾 Record audit log (USER_UPDATE used to represent profile view)
    await logAudit(
      AuditAction.USER_UPDATE,
      user.id,
      req.ip,
      req.headers["user-agent"],
      { event: "PROFILE_VIEW" }
    );

    // ✅ Unified response — matches frontend AuthContext expectations
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
    console.error("❌ /users/me error:", err.message);

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
      error: err.message,
    });
  }
});

export default router;
