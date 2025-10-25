/**
 * 🧩 User Model — Shared between frontend & backend
 * ------------------------------------------------------------
 * Mirrors Prisma `User` model and /api/users/me response.
 * Used across React context, UI components, and API clients.
 */
export interface User {
  /** Internal database UUID */
  id: string;

  /** Firebase UID for cross-system identity mapping */
  firebaseUid: string;

  /** Primary contact email (unique) */
  email: string;

  /** Display name (optional) */
  name?: string | null;

  /** Avatar image URL (Firebase, social, or uploaded) */
  avatarUrl?: string | null;

  /** Role within the Iventics Auth ecosystem */
  role: "ADMIN" | "USER" | "CREATOR" | "MERCHANT";

  /** Whether the account is approved (for restricted systems) */
  isApproved: boolean;

  /** ISO timestamp of record creation */
  createdAt: string;

  /** ISO timestamp of last update */
  updatedAt: string;
}
