/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { toast } from "sonner";

export interface ToastOptions {
  type?: "success" | "error" | "info" | "warning" | "loading";
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

/* ============================================================
   🌈 toastMessage — Unified, Sonner-Compatible
   ------------------------------------------------------------
   • Supports success, error, info, warning, loading
   • Info + warning are simulated via neutral icons
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
    const opts: Record<string, any> = { duration };

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
        toast(message, {
          ...opts,
          icon: "⚠️",
          className: "text-amber-600 dark:text-amber-400",
        });
        break;
      case "info":
        toast(message, {
          ...opts,
          icon: "ℹ️",
          className: "text-blue-600 dark:text-blue-400",
        });
        break;
      case "loading":
        toast.loading(message, opts);
        break;
      default:
        toast(message, opts);
        break;
    }
  } catch (err) {
    console.error("toastMessage runtime error:", err);
  }
}

/* ============================================================
   ⏳ toastAsync — Async wrapper for loading/success/error
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
    success: "Completed successfully.",
    error: "An error occurred.",
    ...messages,
  };

  try {
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

export { toast };
