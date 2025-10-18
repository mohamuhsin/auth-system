import { Router } from "express";
import { authGuard, AuthenticatedRequest } from "../../middleware/authGuard";
import { logAudit } from "../../utils/audit";

const router = Router();

/**
 * 👤 GET /api/users/me
 * Returns the authenticated user's profile based on Firebase session cookie.
 * Also records an audit log for profile access (useful for traceability).
 */
router.get("/", authGuard(), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.authUser)
      return res.status(401).json({ message: "Not authenticated" });

    // 🧾 Record profile view event
    await logAudit(
      "USER_PROFILE_VIEWED",
      req.authUser.uid,
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({
      uid: req.authUser.uid,
      email: req.authUser.email,
      role: req.authUser.role,
      isApproved: req.authUser.isApproved,
    });
  } catch (err: any) {
    console.error("User profile error:", err.message);

    // 🧾 Record unexpected error
    await logAudit(
      "USER_PROFILE_ERROR",
      undefined,
      req.ip,
      req.headers["user-agent"]
    );

    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

export default router;
