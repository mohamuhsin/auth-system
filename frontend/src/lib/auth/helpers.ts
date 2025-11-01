/* eslint-disable @typescript-eslint/no-explicit-any */

/* ============================================================
   🧩 Shared Types
============================================================ */
export interface AuthResult {
  ok: boolean;
  message?: string;
}

/* ============================================================
   🧩 normalizeApi — Normalize backend responses
   ------------------------------------------------------------
   Handles Express JSON, Firebase errors, and custom codes.
   Treats 202 or "pending_verification" as OK (non-error).
============================================================ */
export function normalizeApi(res: any): {
  ok: boolean;
  status?: number;
  message?: string;
  statusText?: string;
} {
  if (!res || typeof res !== "object") return { ok: false };

  // 🧭 Detect numeric status code
  const statusNum =
    typeof res.code === "number"
      ? res.code
      : typeof res.statusCode === "number"
      ? res.statusCode
      : typeof res.status === "number"
      ? res.status
      : undefined;

  // 🧭 Detect textual status
  const statusStr =
    typeof res.status === "string"
      ? res.status.toLowerCase()
      : res.statusText?.toLowerCase?.();

  // ✅ Define positive conditions
  const isSuccess =
    statusStr === "success" ||
    res.ok === true ||
    (typeof statusNum === "number" && statusNum >= 200 && statusNum < 300);

  const isPending =
    statusStr === "pending_verification" ||
    statusStr === "pending" ||
    statusNum === 202;

  // 🧠 Normalize unified response
  return {
    ok: isSuccess || isPending,
    status: statusNum,
    message:
      res.message ||
      (isPending
        ? "Account created. Please verify your email before logging in."
        : undefined),
    statusText: statusStr,
  };
}

/* ============================================================
   🧭 go — Safe redirect with fallback (Next.js-Safe)
   ------------------------------------------------------------
   Uses window.location.assign() for reliability across browsers.
   Falls back gracefully to href if assign fails.
============================================================ */
export function go(path: string, delay = 800) {
  if (typeof window === "undefined") return;

  setTimeout(() => {
    try {
      window.location.assign(path);
    } catch {
      window.location.href = path;
    }
  }, delay);
}

/* ============================================================
   ✉️ actionCodeSettings — For verification email links
   ------------------------------------------------------------
   Used in Firebase sendEmailVerification and reset password flows.
============================================================ */
export const actionCodeSettings =
  typeof window !== "undefined"
    ? {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      }
    : undefined;
