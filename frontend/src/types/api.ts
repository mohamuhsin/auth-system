/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 🌐 API Response Types — Shared (Frontend Level 2.0)
 * ------------------------------------------------------------
 * Standardizes structure for all backend responses.
 * Works perfectly with `apiRequest<T>` in lib/api.ts.
 *
 * ✅ Consistent response envelopes
 * ✅ Auto-typed data for fetch hooks
 * ✅ Works across all domains (auth, users, audit, etc.)
 */

/* ============================================================
   📦 Base Response Types
============================================================ */

/** ✅ Base shape returned by every API endpoint */
export interface ApiResponseBase {
  /** e.g. "success" | "error" */
  status: "success" | "error";
  /** Human-readable explanation */
  message?: string;
  /** Optional numeric HTTP-style code (200, 401, 500...) */
  code?: number;
}

/** ✅ Generic API response with typed `data` */
export interface ApiResponse<T = unknown> extends ApiResponseBase {
  data?: T;
}

/** ✅ Error object for thrown errors (used in apiRequest) */
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

/* ============================================================
   🧱 Common Pagination Wrapper (for list endpoints)
============================================================ */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
