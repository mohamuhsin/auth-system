/**
 * 🧩 User Model — Shared between Frontend & Backend (Level 2.5)
 * ------------------------------------------------------------
 * Mirrors Prisma `User` model + `/api/users/me` response.
 * Used across React Context, UI components, and API clients.
 *
 * ✅  Type-safe with backend
 * ✅  Works seamlessly with Firebase
 * ✅  Supports multi-role & multi-provider systems
 * ✅  Ready for admin dashboards & analytics
 */

/* ============================================================
   🏷️ Role & Provider Constants
   ------------------------------------------------------------
   Exported constants make role-based logic and autocomplete
   reliable in UI forms, dashboards, and access guards.
============================================================ */

export const USER_ROLES = ["ADMIN", "USER", "CREATOR", "MERCHANT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AUTH_PROVIDERS = ["GOOGLE", "PASSWORD", "CUSTOM"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | string;

/* ============================================================
   👤 User Interface
   ------------------------------------------------------------
   Mirrors backend Prisma schema + enriched fields for frontend
   usage (timestamps, provider info, and status).
============================================================ */

export interface User {
  /** 🔹 Internal database UUID (Prisma `User.id`) */
  id: string;

  /** 🔹 Firebase UID for cross-system identity mapping */
  firebaseUid: string;

  /** 📧 Primary contact email (unique) */
  email: string;

  /** 🧑 Display name */
  name?: string | null;

  /** 🖼️ Avatar image URL (Firebase, social, or uploaded) */
  avatarUrl?: string | null;

  /** 🏷️ Role within the Iventics Auth ecosystem */
  role: UserRole;

  /** ✅ Whether the account is approved (e.g., for restricted systems) */
  isApproved: boolean;

  /** 🕒 ISO timestamp of record creation (backend `createdAt`) */
  createdAt: string;

  /** 🔄 ISO timestamp of last update (backend `updatedAt`) */
  updatedAt: string;

  /** ⚙️ Optional status field (matches Prisma `status`) */
  status?: UserStatus;

  /** 🌐 Optional provider (e.g., GOOGLE, PASSWORD, CUSTOM) */
  primaryProvider?: AuthProvider;

  /** 🧭 Optional last login timestamp (ISO) */
  lastLoginAt?: string | null;
}
