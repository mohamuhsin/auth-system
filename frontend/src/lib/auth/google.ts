/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toast, toastMessage } from "@/lib/toast";
import { normalizeApi, go, AuthResult } from "./helpers";

/* ============================================================
   🌐 continueWithGoogle — Sign in OR Sign up (Hook-safe v4.1)
   ------------------------------------------------------------
   • Single unified Google flow (no separate signup)
   • Firebase auto-creates account if user doesn’t exist
   • Exchanges ID token with backend for secure cookie
   • Leaves waitForSession + redirect to caller (React-safe)
   • Clean Sonner toast UX — one message at a time
============================================================ */
export async function continueWithGoogle(): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Connecting to Google...", { type: "loading" });

    // 🔐 1. Open Google popup and authenticate with Firebase
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(true);

    // 🌍 2. Exchange Firebase ID token → backend session cookie
    const raw = await apiRequest("/auth/login-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken },
    });

    const res = normalizeApi(raw);
    toast.dismiss();

    // ⚠️ 3. Backend failure
    if (!res.ok) {
      toastMessage(res.message || "Google sign-in failed.", { type: "error" });
      return { ok: false, message: res.message || "Google sign-in failed." };
    }

    // ✅ 4. Success (waitForSession + redirect handled by caller)
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;

    /* ============================================================
       ⚠️ Firebase / Google Error Handling
    ============================================================ */
    switch (code) {
      case "auth/popup-closed-by-user":
        toastMessage("Google sign-in was cancelled.", { type: "info" });
        return { ok: false, message: "Popup closed by user." };

      case "auth/network-request-failed":
        toastMessage("Network error. Please check your connection.", {
          type: "error",
        });
        return { ok: false, message: "Network error." };

      default: {
        const msg =
          err?.data?.message ||
          err?.message ||
          "Unexpected error during Google sign-in.";
        toastMessage(msg, { type: "error" });
        return { ok: false, message: msg };
      }
    }
  }
}
