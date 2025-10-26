/**
 * 🧠 Iventics Auth System — Shared Types Index (Level 2.0)
 * ------------------------------------------------------------
 * Centralized re-exports for all core type definitions.
 * Import from here instead of deep paths:
 *    import { User, AuditLog, ApiResponse } from "@/types";
 */

export * from "./user";
export * from "./auditLog";
export * from "./api";

/**
 * 💡 Optional aliases for clarity in UI or SDKs.
 * These don’t create new files but make imports clearer.
 */
export type { ApiResponse as HttpResponse } from "./api";
export type { AuditLog as LogEntry } from "./auditLog";
export type { User as AuthUser } from "./user";
