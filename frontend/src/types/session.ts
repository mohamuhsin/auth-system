/**
 * 🧩 Session Model — Shared between Frontend & Backend (Level 2.0)
 * ---------------------------------------------------------------
 * Mirrors Prisma `Session` model and `/api/auth/session` responses.
 * Used for session tracking, audits, and client analytics.
 *
 * ✅ Matches Prisma schema
 * ✅ Type-safe for frontend state / admin dashboards
 * ✅ Ready for cross-domain secure cookies (Firebase Session Cookies)
 */
export interface Session {
  /** 🔹 Internal database UUID (Prisma `Session.id`) */
  id: string;

  /** 🔒 SHA-256 hash of the Firebase session cookie */
  tokenHash: string;

  /** 👤 Linked user ID (FK → User.id) */
  userId: string;

  /** 🌐 IP address from which the session was created */
  ipAddress?: string | null;

  /** 💻 Browser or client User-Agent string */
  userAgent?: string | null;

  /** 🕒 ISO timestamp — Session creation time */
  createdAt: string;

  /** 🕓 ISO timestamp — If revoked manually or expired early */
  revokedAt?: string | null;

  /** ⏳ ISO timestamp — Scheduled expiration time */
  expiresAt: string;

  /** 🧠 Optional populated user object for dashboards */
  user?: {
    id: string;
    email: string;
    name?: string | null;
    role?: "ADMIN" | "USER" | "CREATOR" | "MERCHANT";
  };
}
