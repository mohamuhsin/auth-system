export const USER_ROLES = ["ADMIN", "USER", "CREATOR", "MERCHANT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AUTH_PROVIDERS = ["GOOGLE", "PASSWORD", "CUSTOM"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | string;
export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  status?: UserStatus;
  primaryProvider?: AuthProvider;
  lastLoginAt?: string | null;
}
