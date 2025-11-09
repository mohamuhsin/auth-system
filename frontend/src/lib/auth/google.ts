/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toast, toastMessage } from "@/lib/toast";
import { normalizeApi, go, AuthResult } from "./helpers";

export async function continueWithGoogle(): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Connecting to Google...", { type: "loading" });

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(true);

    let raw = await apiRequest("/auth/login-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken },
    });
    let res = normalizeApi(raw);

    if (
      res.status === 404 ||
      res.message?.toLowerCase().includes("not found")
    ) {
      console.info("Google user not found → auto-signing up...");
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

    if (!res.ok) {
      toastMessage(res.message || "Google sign-in failed.", { type: "error" });
      return { ok: false, message: res.message || "Google sign-in failed." };
    }

    toastMessage("Welcome!", { type: "success" });
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;

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
