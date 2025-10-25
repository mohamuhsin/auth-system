/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toastAsync, toastMessage } from "@/lib/toast";

/* ============================================================
   🆕 Signup with Email + Password
============================================================ */
export async function signupWithEmailPassword(
  email: string,
  password: string,
  name?: string
) {
  return toastAsync(
    async () => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 🔐 Send verification email
      await sendEmailVerification(cred.user);

      // 🔑 Get Firebase ID token
      const idToken = await cred.user.getIdToken();

      // 🚀 Register new user in backend
      await apiRequest("/auth/signup-with-firebase", {
        method: "POST",
        body: { idToken, name },
      });

      // 🚫 Sign out before email verification
      await signOut(auth);

      toastMessage(
        "Account created! Check your email to verify before logging in.",
        { type: "success" }
      );

      return { ok: true };
    },
    {
      loading: "Creating your account...",
      success: "Account created successfully!",
      error: "Signup failed. Please try again.",
    }
  ).catch((err: any) => {
    const code = err?.code || "";
    if (err?.status === 409 || code === "auth/email-already-in-use") {
      toastMessage("Account already exists. Redirecting to login...", {
        type: "warning",
      });
      setTimeout(() => (window.location.href = "/login"), 1200);
    } else if (code === "auth/invalid-email") {
      toastMessage("Invalid email address. Please check again.", {
        type: "error",
      });
    } else if (code === "auth/weak-password") {
      toastMessage(
        "Weak password. Use at least 8 characters, a number, and an uppercase letter.",
        { type: "warning" }
      );
    } else {
      toastMessage(err?.message || "Signup failed", { type: "error" });
    }
    return { ok: false };
  });
}

/* ============================================================
   🔐 Login with Email + Password
============================================================ */
export async function loginWithEmailPassword(email: string, password: string) {
  return toastAsync(
    async () => {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // ⛔ Prevent login if email not verified
      if (!cred.user.emailVerified) {
        await signOut(auth);
        throw { status: 403, message: "Please verify your email first." };
      }

      const idToken = await cred.user.getIdToken();

      await apiRequest("/auth/login-with-firebase", {
        method: "POST",
        body: { idToken },
      });

      toastMessage("Welcome back!", { type: "success" });
      return { ok: true };
    },
    {
      loading: "Signing you in...",
      success: "Logged in successfully!",
      error: "Login failed. Please try again.",
    }
  ).catch((err: any) => {
    if (err?.status === 404) {
      toastMessage("No account found. Redirecting to signup...", {
        type: "warning",
      });
      setTimeout(() => (window.location.href = "/signup"), 1200);
    } else if (err?.status === 403) {
      toastMessage("Please verify your email before logging in.", {
        type: "warning",
      });
    } else {
      toastMessage(err?.message || "Login failed", { type: "error" });
    }
    return { ok: false };
  });
}

/* ============================================================
   🔁 Password Reset
============================================================ */
export async function requestPasswordReset(email: string) {
  return toastAsync(
    async () => {
      await sendPasswordResetEmail(auth, email);
      toastMessage("Password reset link sent! Check your inbox.", {
        type: "success",
      });
      return { ok: true };
    },
    {
      loading: "Sending password reset email...",
      success: "Reset email sent!",
      error: "Failed to send reset email.",
    }
  ).catch((err: any) => {
    const code = err?.code || "";
    if (code === "auth/user-not-found") {
      toastMessage("No account found with that email. Please sign up first.", {
        type: "warning",
      });
    } else if (code === "auth/invalid-email") {
      toastMessage("Please enter a valid email address.", { type: "error" });
    } else {
      toastMessage(err?.message || "Reset failed", { type: "error" });
    }
    return { ok: false };
  });
}

/* ============================================================
   ✉️ Resend Verification Email
============================================================ */
export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) {
    toastMessage("Please log in again before resending verification.", {
      type: "error",
    });
    setTimeout(() => (window.location.href = "/login"), 1200);
    return { ok: false };
  }

  return toastAsync(
    async () => {
      await sendEmailVerification(user);
    },
    {
      loading: "Sending verification email...",
      success: "Verification link sent successfully!",
      error: "Failed to resend verification email. Try again.",
    }
  ).catch((err: any) => {
    const code = err?.code || "";
    if (code === "auth/too-many-requests") {
      toastMessage(
        "You’ve requested too many verification emails. Please wait a few minutes.",
        { type: "warning" }
      );
    } else {
      toastMessage("Something went wrong. Please try again.", {
        type: "error",
      });
    }
    return { ok: false };
  });
}
