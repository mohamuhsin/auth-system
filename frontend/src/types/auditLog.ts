/* eslint-disable @typescript-eslint/no-explicit-any */
import type { User } from "@/types/user";

export const AUDIT_ACTIONS = [
  "USER_SIGNUP",
  "USER_LOGIN",
  "USER_LOGOUT",
  "USER_LOGOUT_FAILED",
  "USER_LOGOUT_NO_COOKIE",
  "USER_LOGOUT_ERROR",
  "SESSION_REFRESH",
  "SESSION_REVOKE",
  "USER_UPDATE",
  "USER_APPROVE",
  "USER_SUSPEND",
  "USER_DELETE",
  "RATE_LIMIT_HIT",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: Pick<User, "id" | "email" | "name" | "role"> | null;
  action: AuditAction;
  message?: string | null;
  metadata?: Record<string, any> | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  meta?: {
    label: string;
    description: string;
    category: string;
  };
}
