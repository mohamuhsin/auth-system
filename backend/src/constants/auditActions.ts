import { AuditAction } from "@prisma/client";

/**
 * 🧾 AUDIT ACTION METADATA (Level 2.0)
 * ------------------------------------------------------------
 * Human-readable descriptions for each AuditAction enum value.
 * Used for internal logs, analytics, and admin reporting.
 */
export const AUDIT_ACTIONS: Record<
  AuditAction,
  { label: string; description: string; category: string }
> = {
  // 🧍 USER LIFECYCLE
  USER_SIGNUP: {
    label: "User Signup",
    description: "A new user account was created.",
    category: "User Lifecycle",
  },
  USER_LOGIN: {
    label: "User Login",
    description: "User successfully logged in.",
    category: "User Lifecycle",
  },
  USER_LOGOUT: {
    label: "User Logout",
    description: "User successfully logged out.",
    category: "User Lifecycle",
  },
  USER_LOGOUT_FAILED: {
    label: "Logout Failed",
    description: "A logout attempt failed (invalid or expired session).",
    category: "User Lifecycle",
  },
  USER_LOGOUT_NO_COOKIE: {
    label: "Logout No Cookie",
    description: "A logout request was made without a valid session cookie.",
    category: "User Lifecycle",
  },
  USER_LOGOUT_ERROR: {
    label: "Logout Error",
    description: "An unexpected error occurred during logout.",
    category: "User Lifecycle",
  },

  // 🔑 SESSIONS
  SESSION_REFRESH: {
    label: "Session Refreshed",
    description: "A session token was refreshed successfully.",
    category: "Session",
  },
  SESSION_REVOKE: {
    label: "Session Revoked",
    description: "A session was manually revoked by user or system.",
    category: "Session",
  },

  // 👤 ACCOUNT MANAGEMENT
  USER_UPDATE: {
    label: "User Updated",
    description: "User profile or settings were updated.",
    category: "Account",
  },
  USER_APPROVE: {
    label: "User Approved",
    description: "User account was approved by an admin.",
    category: "Account",
  },
  USER_SUSPEND: {
    label: "User Suspended",
    description: "User account was suspended due to policy violation.",
    category: "Account",
  },
  USER_DELETE: {
    label: "User Deleted",
    description: "User account was deleted from the system.",
    category: "Account",
  },

  // ⚙️ SYSTEM
  RATE_LIMIT_HIT: {
    label: "Rate Limit Hit",
    description: "Rate limit was triggered for an IP or route.",
    category: "System",
  },
};

/**
 * 🧠 Helper — Get metadata for a given AuditAction.
 */
export function getAuditActionInfo(action: AuditAction) {
  return (
    AUDIT_ACTIONS[action] ?? {
      label: action,
      description: "Unknown or custom audit action.",
      category: "Unknown",
    }
  );
}
