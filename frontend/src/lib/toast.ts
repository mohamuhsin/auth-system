/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { toast } from "sonner";

/* ============================================================
   🍞 Toast Utilities — Iventics Auth System
   ------------------------------------------------------------
   Provides:
   - toastMessage(): instant toast
   - toastAsync(): promise-based toasts with auto feedback
============================================================ */

export interface ToastOptions {
  type?: "success" | "error" | "info" | "warning" | "loading";
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * 🪶 toastMessage — Simple toast for quick feedback
 */
export function toastMessage(
  message: string,
  {
    type = "success",
    duration = 4000,
    actionLabel,
    onAction,
  }: ToastOptions = {}
) {
  const opts = {
    duration,
    action:
      actionLabel && onAction
        ? { label: actionLabel, onClick: onAction }
        : undefined,
  };

  switch (type) {
    case "success":
      toast.success(message, opts);
      break;
    case "error":
      toast.error(message, opts);
      break;
    case "warning":
      toast.warning(message, opts);
      break;
    case "info":
      toast.info(message, opts);
      break;
    case "loading":
      toast.loading(message, opts);
      break;
    default:
      toast(message, opts);
  }
}

/**
 * ⚙️ toastAsync — Async wrapper with automatic loading/success/error
 */
export async function toastAsync<T>(
  fn: () => Promise<T>,
  messages?: {
    loading?: string;
    success?: string;
    error?: string;
  },
  duration = 4000
): Promise<T | undefined> {
  const { loading, success, error } = {
    loading: "Processing...",
    success: "Done successfully!",
    error: "Something went wrong.",
    ...messages,
  };

  try {
    // 🔄 Wrap the async function with sonner's built-in promise toast
    const wrapped = toast.promise(fn(), {
      loading,
      success,
      error,
      duration,
    }) as unknown as Promise<T>;

    const result = await wrapped;
    return result;
  } catch (err: any) {
    const msg =
      err?.message ||
      err?.response?.data?.message ||
      err?.error ||
      "Unexpected error occurred.";
    toast.error(msg, { duration });
    return undefined;
  }
}
export { toast };
