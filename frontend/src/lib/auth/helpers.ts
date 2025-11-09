/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AuthResult {
  ok: boolean;
  message?: string;
}

export function normalizeApi(res: any): {
  ok: boolean;
  status?: number;
  message?: string;
  statusText?: string;
} {
  if (!res || typeof res !== "object") return { ok: false };

  const statusNum =
    typeof res.code === "number"
      ? res.code
      : typeof res.statusCode === "number"
      ? res.statusCode
      : typeof res.status === "number"
      ? res.status
      : undefined;

  const statusStr =
    typeof res.status === "string"
      ? res.status.toLowerCase()
      : res.statusText?.toLowerCase?.();

  const isSuccess =
    statusStr === "success" ||
    res.ok === true ||
    (typeof statusNum === "number" && statusNum >= 200 && statusNum < 300);

  const isPending =
    statusStr === "pending_verification" ||
    statusStr === "pending" ||
    statusNum === 202;

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

export const actionCodeSettings =
  typeof window !== "undefined"
    ? {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      }
    : undefined;
