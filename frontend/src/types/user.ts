/**
 * 🧩 User Model — Shared between Frontend & Backend (Level 2.0)
 * ------------------------------------------------------------
 * Mirrors Prisma `User` model + `/api/users/me` response.
 * Used across React Context, UI components, and API clients.
 *
 * ✅  Type-safe with backend
 * ✅  Works seamlessly with Firebase
 * ✅  Supports multi-role systems (Admin, Creator, Merchant, etc.)
 */
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
  role: "ADMIN" | "USER" | "CREATOR" | "MERCHANT";

  /** ✅ Whether the account is approved (e.g. for restricted systems) */
  isApproved: boolean;

  /** 🕒 ISO timestamp of record creation (backend `createdAt`) */
  createdAt: string;

  /** 🔄 ISO timestamp of last update (backend `updatedAt`) */
  updatedAt: string;

  /** ⚙️ Optional status field (matches Prisma `status`) */
  status?: "ACTIVE" | "SUSPENDED" | "PENDING" | string;

  /** 🌐 Optional provider (e.g., GOOGLE, PASSWORD, CUSTOM) */
  primaryProvider?: "GOOGLE" | "PASSWORD" | "CUSTOM";

  /** 🧭 Optional last login timestamp (ISO) */
  lastLoginAt?: string | null;
}
