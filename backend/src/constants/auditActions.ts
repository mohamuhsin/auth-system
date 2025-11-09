import { AuditAction } from "@prisma/client";

export const AUDIT_ACTIONS: Record<
  AuditAction,
  {
    label: string;
    description: string;
    category: string;
    severity?: "INFO" | "WARN" | "ERROR" | "SECURITY";
  }
> = {
  USER_SIGNUP: {
    label: "User Signup",
    description: "A new user account was created.",
    category: "User Lifecycle",
    severity: "INFO",
  },
  USER_LOGIN: {
    label: "User Login",
    description: "User successfully logged in.",
    category: "User Lifecycle",
    severity: "INFO",
  },
  USER_LOGOUT: {
    label: "User Logout",
    description: "User successfully logged out.",
    category: "User Lifecycle",
    severity: "INFO",
  },
  USER_LOGOUT_FAILED: {
    label: "Logout Failed",
    description: "A logout attempt failed (invalid or expired session).",
    category: "User Lifecycle",
    severity: "WARN",
  },
  USER_LOGOUT_NO_COOKIE: {
    label: "Logout No Cookie",
    description: "A logout request was made without a valid session cookie.",
    category: "User Lifecycle",
    severity: "WARN",
  },
  USER_LOGOUT_ERROR: {
    label: "Logout Error",
    description: "An unexpected error occurred during logout.",
    category: "User Lifecycle",
    severity: "ERROR",
  },

  SESSION_REFRESH: {
    label: "Session Refreshed",
    description: "A session token was refreshed successfully.",
    category: "Session",
    severity: "INFO",
  },
  SESSION_REVOKE: {
    label: "Session Revoked",
    description: "A session was manually revoked by user or system.",
    category: "Session",
    severity: "SECURITY",
  },

  USER_UPDATE: {
    label: "User Updated",
    description: "User profile or settings were updated.",
    category: "Account",
    severity: "INFO",
  },
  USER_APPROVE: {
    label: "User Approved",
    description: "User account was approved by an admin.",
    category: "Account",
    severity: "INFO",
  },
  USER_SUSPEND: {
    label: "User Suspended",
    description: "User account was suspended due to policy violation.",
    category: "Account",
    severity: "WARN",
  },
  USER_DELETE: {
    label: "User Deleted",
    description: "User account was permanently deleted.",
    category: "Account",
    severity: "ERROR",
  },

  PASSWORD_RESET: {
    label: "Password Reset",
    description: "User requested a password reset email.",
    category: "Security",
    severity: "INFO",
  },
  PASSWORD_CHANGE: {
    label: "Password Changed",
    description: "User successfully changed their password.",
    category: "Security",
    severity: "INFO",
  },
  EMAIL_VERIFIED: {
    label: "Email Verified",
    description: "User verified their email address successfully.",
    category: "Security",
    severity: "INFO",
  },

  RATE_LIMIT_HIT: {
    label: "Rate Limit Hit",
    description: "Rate limit was triggered for an IP or route.",
    category: "System",
    severity: "WARN",
  },
};

export function getAuditActionInfo(action: AuditAction) {
  return (
    AUDIT_ACTIONS[action] ?? {
      label: action,
      description: "Unknown or custom audit action.",
      category: "Unknown",
      severity: "INFO",
    }
  );
}
