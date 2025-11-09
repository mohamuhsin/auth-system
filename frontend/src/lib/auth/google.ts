/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toast, toastMessage } from "@/lib/toast";
import { normalizeApi, go, AuthResult } from "./helpers";

/* ============================================================
   🌐 continueWithGoogle — Sign in OR Sign up (Hook-safe v4.3)
   ------------------------------------------------------------
   • Single unified Google flow (login → signup fallback)
   • Firebase authenticates user + returns ID token
   • Backend auto-creates if user not found (404)
   • Adds success toast for consistent UX
   • Leaves waitForSession + redirect to caller (React-safe)
============================================================ */
export async function continueWithGoogle(): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Connecting to Google...", { type: "loading" });

    // 🔐 1. Authenticate via Firebase popup
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(true);

    // 🌍 2. Try backend login first
    let raw = await apiRequest("/auth/login-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken },
    });
    let res = normalizeApi(raw);

    // 🧩 3. If account not found → fallback to signup
    if (
      res.status === 404 ||
      res.message?.toLowerCase().includes("not found")
    ) {
      console.info("🆕 Google user not found → auto-signing up...");
      raw = await apiRequest("/auth/signup-with-firebase", {
        method: "POST",
        credentials: "include",
        body: {
          idToken,
          name: result.user.displayName,
          avatarUrl: result.user.photoURL,
        },
      });
      res = normalizeApi(raw);
    }

    toast.dismiss();

    // ⚠️ 4. Backend failure
    if (!res.ok) {
      toastMessage(res.message || "Google sign-in failed.", { type: "error" });
      return { ok: false, message: res.message || "Google sign-in failed." };
    }

    // ✅ 5. Success (waitForSession + redirect handled by caller)
    toastMessage("Welcome!", { type: "success" });
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
