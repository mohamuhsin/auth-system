/**
 * 🧠 Iventics Auth System — Shared Types Index (Level 2.5)
 * ------------------------------------------------------------
 * Centralized re-exports for all core type definitions.
 *
 * 🧩 Purpose:
 *  • Provides a single import entry for all shared models
 *  • Keeps imports clean across the app, SDKs, and admin dashboards
 *
 * ✅  Unified typing across frontend & backend
 * ✅  Works seamlessly with apiRequest<T>
 * ✅  Ready for SDKs or multi-app reuse (e.g. UgaPay, PMS, etc.)
 *
 * Usage:
 *    import { User, AuditLog, ApiResponse, Session } from "@/types";
 */

export * from "./user";
export * from "./auditLog";
export * from "./session";
export * from "./api";

/* ============================================================
   💡 Optional Aliases
   ------------------------------------------------------------
   These aliases improve clarity in UI or SDK-specific contexts
   without duplicating logic or creating new files.
============================================================ */

export type { ApiResponse as HttpResponse } from "./api";
export type { AuditLog as LogEntry } from "./auditLog";
export type { User as AuthUser } from "./user";
export type { Session as AuthSession } from "./session";
