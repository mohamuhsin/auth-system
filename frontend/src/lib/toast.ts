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
   🌈 toastMessage — Unified, shadcn/Sonner Pure
   ------------------------------------------------------------
   • Supports success, error, info, warning, loading
   • Pure Sonner styling — no emojis or custom overrides
============================================================ */
export function toastMessage(
  message: string,
  {
    type = "success",
    duration = 6000,
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

/* ============================================================
   ⏳ toastAsync — Async wrapper (no default “completed successfully”)
   ------------------------------------------------------------
   • Shows loading + error automatically
   • Only shows success toast if explicitly provided
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
    loading: messages?.loading ?? "Processing...",
    success: messages?.success, // 🧹 no default success message
    error: messages?.error ?? "An error occurred.",
  };

  try {
    const result = (await toast.promise(fn(), {
      loading,
      success: success || undefined, // only show success toast if defined
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
   🧹 toastClear — Clears all active toasts
============================================================ */
export function toastClear(): void {
  try {
    toast.dismiss();
  } catch (err) {
    console.error("toastClear error:", err);
  }
}

/* ============================================================
   ♻️ toastSafe — Deduplicated message handler
============================================================ */
const activeToasts = new Map<string, string | number>();

export function toastSafe(message: string, options: ToastOptions = {}): void {
  try {
    const { type = "info", duration = 6000 } = options;
    const existingId = activeToasts.get(message);

    if (existingId !== undefined) {
      toast.dismiss(existingId);
      activeToasts.delete(message);
    }

    const id = toast(message, {
      duration,
      description:
        type === "loading"
          ? "Please wait..."
          : type === "success"
          ? "Done"
          : type === "error"
          ? "Something went wrong"
          : undefined,
    });

    activeToasts.set(message, id);

    setTimeout(() => activeToasts.delete(message), duration + 500);
  } catch (err) {
    console.error("toastSafe error:", err);
  }
}

export { toast };
