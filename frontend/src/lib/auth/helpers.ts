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
   Detects "pending_verification" + 202 as non-error states.
============================================================ */
export function normalizeApi(res: any): {
  ok: boolean;
  status?: number;
  message?: string;
  statusText?: string;
} {
  if (!res || typeof res !== "object") return { ok: false };

  // 🧭 Detect numeric code
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

  // ✅ Define success and verification conditions
  const isSuccess =
    statusStr === "success" ||
    res.ok === true ||
    (typeof statusNum === "number" && statusNum >= 200 && statusNum < 300);

  const isPending = statusStr === "pending_verification" || statusNum === 202;

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
============================================================ */
export const actionCodeSettings =
  typeof window !== "undefined"
    ? {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      }
    : undefined;
