/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { toast } from "sonner";

/* ============================================================
   🔔 Toast Types
============================================================ */
export interface ToastOptions {
  type?: "success" | "error" | "info" | "warning" | "loading";
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

/* ============================================================
   🪶 toastMessage — Immediate Toast Notification
   ------------------------------------------------------------
   • Use for instant feedback messages
   • Supports all toast types
   • Gracefully handles Sonner runtime errors
============================================================ */
export function toastMessage(
  message: string,
  {
    type = "success",
    duration = 4000,
    actionLabel,
    onAction,
  }: ToastOptions = {}
): void {
  try {
    const opts: Record<string, any> = {
      duration,
    };

    if (actionLabel && onAction) {
      opts.action = { label: actionLabel, onClick: onAction };
    }

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
        break;
    }
  } catch (err) {
    console.error("Toast render error:", err);
  }
}

/* ============================================================
   ⚙️ toastAsync — Async Promise Wrapper
   ------------------------------------------------------------
   • Wraps async operations for UX feedback
   • Shows loading, success, and error toasts
   • Returns resolved value or undefined on failure
============================================================ */
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
    success: "Completed successfully!",
    error: "Something went wrong.",
    ...messages,
  };

  try {
    // ✅ Sonner's toast.promise automatically handles states
    const result = (await toast.promise(fn(), {
      loading,
      success,
      error,
      duration,
    })) as T;

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

/* ============================================================
   🧱 Export Base
============================================================ */
export { toast };
