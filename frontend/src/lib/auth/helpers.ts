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
   Safely normalizes responses from both backend endpoints and
   Firebase Admin SDK (with flexible shape handling).
============================================================ */
export function normalizeApi(res: any): {
  ok: boolean;
  status?: number;
  message?: string;
} {
  if (res && typeof res === "object" && "ok" in res && "status" in res) {
    return { ok: !!res.ok, status: Number(res.status), message: res.message };
  }

  if (res && typeof res === "object") {
    const statusNum =
      typeof res.code === "number"
        ? res.code
        : typeof res.statusCode === "number"
        ? res.statusCode
        : typeof res.status === "number"
        ? res.status
        : undefined;

    const statusStr = res.status ?? res.statusText;
    const ok =
      statusStr === "success" ||
      (typeof statusNum === "number" && statusNum >= 200 && statusNum < 300);

    return { ok, status: statusNum, message: res.message };
  }

  return { ok: false };
}

/* ============================================================
   🧭 go — Safe redirect with fallback (Next.js-Safe)
   ------------------------------------------------------------
   • Uses window.location.assign for consistent behavior
   • Delayed to avoid conflicts with React state updates
   • Falls back to href if assign fails
============================================================ */
export function go(path: string, delay = 800) {
  if (typeof window === "undefined") return;

  setTimeout(() => {
    try {
      // ✅ assign() adds a history entry and avoids SSR issues
      window.location.assign(path);
    } catch {
      window.location.href = path;
    }
  }, delay);
}

/* ============================================================
   ✉️ actionCodeSettings — For verification email links
   ------------------------------------------------------------
   Used in Firebase sendEmailVerification / password reset.
   Dynamically builds the correct URL based on current origin.
============================================================ */
export const actionCodeSettings =
  typeof window !== "undefined"
    ? {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      }
    : undefined;
