import type { UserRole } from "@/types/user";
export interface Session {
  id: string;
  tokenHash: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  revokedAt?: string | null;
  expiresAt: string;
  user?: {
    id: string;
    email: string;
    name?: string | null;
    role?: UserRole;
  };
}

export type SessionStatus = "ACTIVE" | "REVOKED" | "EXPIRED";
