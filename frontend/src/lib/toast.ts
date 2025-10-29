/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { toast } from "sonner";

/* ============================================================
   Toast Configuration
   ------------------------------------------------------------
   • Centralized toast utility for consistent feedback
   • Supports: success, error, warning, info, loading
   • Use toastMessage for instant feedback
   • Use toastAsync for async operations
============================================================ */

export interface ToastOptions {
  type?: "success" | "error" | "info" | "warning" | "loading";
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

/* ------------------------------------------------------------
   toastMessage — Immediate Toast Notification
   Used for direct feedback after an event or validation
------------------------------------------------------------ */
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
    console.error("toastMessage runtime error:", err);
  }
}

/* ------------------------------------------------------------
   toastAsync — Async Promise Wrapper
   Used to wrap async operations with loading/success/error states
------------------------------------------------------------ */
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

/* ------------------------------------------------------------
   Export Base
------------------------------------------------------------ */
export { toast };
