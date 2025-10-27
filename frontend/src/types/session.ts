/**
 * 🧩 Session Model — Shared between Frontend & Backend (Level 2.5)
 * ----------------------------------------------------------------
 * Mirrors Prisma `Session` model and `/api/auth/session` responses.
 * Used for:
 *   • session tracking & security analytics
 *   • admin dashboards / audits
 *   • Firebase session-cookie lifecycle
 *
 * ✅ Matches Prisma schema
 * ✅ Type-safe for frontend state & dashboards
 * ✅ Works with cross-domain secure cookies (__Secure-iventics_session)
 */

import type { UserRole } from "@/types/user";

/* ============================================================
   🧱 Session Interface
============================================================ */

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

  /** 🕒 ISO timestamp — session creation time */
  createdAt: string;

  /** 🕓 ISO timestamp — if revoked manually or expired early */
  revokedAt?: string | null;

  /** ⏳ ISO timestamp — scheduled expiration time */
  expiresAt: string;

  /** 🧠 Optional populated user object (for admin dashboards) */
  user?: {
    id: string;
    email: string;
    name?: string | null;
    role?: UserRole;
  };
}

/* ============================================================
   🧩 SessionStatus (optional helper)
   ------------------------------------------------------------
   Derived helper type for UI dashboards or analytics logic.
============================================================ */
export type SessionStatus = "ACTIVE" | "REVOKED" | "EXPIRED";
