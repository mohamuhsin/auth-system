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
   🪶 toastMessage — Lightweight Immediate Toast
============================================================ */
export function toastMessage(
  message: string,
  {
    type = "success",
    duration = 4000,
    actionLabel,
    onAction,
  }: ToastOptions = {}
) {
  try {
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
  } catch (err) {
    // Prevent runtime crash if Sonner misbehaves
    console.error("Toast render error:", err);
  }
}

/* ============================================================
   ⚙️ toastAsync — Promise Wrapper with Auto Feedback
============================================================ */
export async function toastAsync<T>(
  fn: () => Promise<T>,
  messages?: { loading?: string; success?: string; error?: string },
  duration = 4000
): Promise<T | undefined> {
  const { loading, success, error } = {
    loading: "Processing...",
    success: "Completed successfully!",
    error: "Something went wrong.",
    ...messages,
  };

  try {
    // Sonner’s toast.promise returns void; we cast to Promise<T>
    const wrapped = toast.promise(fn(), {
      loading,
      success,
      error,
      duration,
    }) as unknown as Promise<T>;

    return await wrapped;
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
