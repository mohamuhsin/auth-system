import { Router } from "express";
import { authGuard, AuthenticatedRequest } from "../../middleware/authGuard";
import { logAudit } from "../../utils/audit";

const router = Router();

/**
 * 👤 GET /api/users/me
 * ------------------------------------------------------------
 * Returns the authenticated user's profile based on Firebase session cookie.
 * Includes name, avatar, and role info merged from DB + Firebase.
 */
router.get("/", authGuard(), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.authUser;

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated",
      });
    }

    // 🧾 Record profile view
    await logAudit(
      "USER_PROFILE_VIEWED",
      user.uid,
      req.ip,
      req.headers["user-agent"]
    );

    // ✅ Return flat user object
    return res.status(200).json({
      status: "success",
      uid: user.uid,
      email: user.email,
      role: user.role,
      name: user.name || null,
      avatarUrl: user.avatarUrl || user.photoURL || null,
      isApproved: user.isApproved,
    });
  } catch (err: any) {
    console.error("User profile error:", err.message);

    // 🧾 Log unexpected error
    await logAudit(
      "USER_PROFILE_ERROR",
      undefined,
      req.ip,
      req.headers["user-agent"]
    );

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch profile",
    });
  }
});

export default router;
