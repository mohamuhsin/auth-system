/* eslint-disable @typescript-eslint/no-explicit-any */
import type { User } from "@/types/user";

/**
 * 🧩 AuditAction Enum (Frontend Mirror)
 * ------------------------------------------------------------
 * Mirrors Prisma enum on backend to avoid importing `@prisma/client`
 * This keeps frontend lightweight and type-safe.
 */
export type AuditAction =
  | "USER_SIGNUP"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_LOGOUT_FAILED"
  | "USER_LOGOUT_NO_COOKIE"
  | "USER_LOGOUT_ERROR"
  | "SESSION_REFRESH"
  | "SESSION_REVOKE"
  | "USER_UPDATE"
  | "USER_APPROVE"
  | "USER_SUSPEND"
  | "USER_DELETE"
  | "RATE_LIMIT_HIT";

/**
 * 🧾 Audit Log Model — Shared between Frontend & Backend (Level 2.0)
 * ------------------------------------------------------------------
 * Mirrors Prisma `AuditLog` + enriched `/api/audit/logs` responses.
 * Used for admin dashboards, monitoring, and analytics.
 */
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

  /** 🧠 Enriched metadata (from backend via getAuditActionInfo) */
  meta?: {
    label: string;
    description: string;
    category: string;
  };
}
