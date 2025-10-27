/* eslint-disable @typescript-eslint/no-explicit-any */
import type { User } from "@/types/user";

/* ============================================================
   🧩 AuditAction Enum (Frontend Mirror)
   ------------------------------------------------------------
   Mirrors the Prisma enum from the backend to avoid importing
   `@prisma/client` in the frontend. Lightweight, tree-shakable,
   and IDE-friendly (autocomplete + type-safe).
============================================================ */

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

/** ✅ Union type for all valid audit actions */
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/* ============================================================
   🧾 AuditLog Interface — Shared between Frontend & Backend
   ------------------------------------------------------------
   Mirrors Prisma `AuditLog` model + enriched metadata from the
   backend `/api/audit/logs` endpoint (Level 2.0+).
============================================================ */

export interface AuditLog {
  /** Unique log ID (UUID) */
  id: string;

  /** Related user (optional for anonymous or system events) */
  userId?: string | null;
  user?: Pick<User, "id" | "email" | "name" | "role"> | null;

  /** Action type — enum from AuditAction */
  action: AuditAction;

  /** Human-readable description or event summary */
  message?: string | null;

  /** Optional structured data (request context, metadata, etc.) */
  metadata?: Record<string, any> | null;

  /** Request correlation info */
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;

  /** Timestamp (ISO string) */
  createdAt: string;

  /** 🧠 Optional enriched metadata (e.g., for dashboards) */
  meta?: {
    /** Short label for UI tables (e.g. "User Login") */
    label: string;
    /** More detailed text for audit drill-down views */
    description: string;
    /** Category grouping (e.g. "auth", "session", "user") */
    category: string;
  };
}
