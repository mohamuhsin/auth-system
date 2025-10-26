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
   🧩 Shared Auth Result Type (2.0 Safe)
============================================================ */
export interface AuthResult {
  ok: boolean;
  message?: string;
}

/* ============================================================
   🆕 Signup — Email + Password
============================================================ */
export async function signupWithEmailPassword(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  const result = await toastAsync(
    async () => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 🔐 Send verification email
      await sendEmailVerification(cred.user);

      // 🔑 Firebase ID token → backend signup route
      const idToken = await cred.user.getIdToken();

      await apiRequest("/auth/signup-with-firebase", {
        method: "POST",
        body: { idToken, name },
        credentials: "include",
      });

      // 🚫 Sign out until verified
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
  ).catch((err: any): AuthResult => {
    const code = err?.code || "";
    if (err?.status === 409 || code === "auth/email-already-in-use") {
      toastMessage("Account already exists. Redirecting to login...", {
        type: "warning",
      });
      setTimeout(() => (window.location.href = "/login"), 1200);
      return { ok: false, message: "Account already exists." };
    }

    if (code === "auth/invalid-email") {
      toastMessage("Invalid email address.", { type: "error" });
      return { ok: false, message: "Invalid email." };
    }

    if (code === "auth/weak-password") {
      toastMessage("Weak password. Try a stronger one.", { type: "warning" });
      return { ok: false, message: "Weak password." };
    }

    const msg = err?.message || "Signup failed.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  });

  // ✅ Ensure defined result
  return result ?? { ok: false, message: "Unexpected signup error." };
}

/* ============================================================
   🔐 Login — Email + Password
============================================================ */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const result = await toastAsync(
    async () => {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // ⛔ Require verified email
      if (!cred.user.emailVerified) {
        await signOut(auth);
        throw { status: 403, message: "Please verify your email first." };
      }

      // 🔑 Firebase → backend → cookie
      const idToken = await cred.user.getIdToken();

      await apiRequest("/auth/login-with-firebase", {
        method: "POST",
        body: { idToken },
        credentials: "include",
      });

      toastMessage("Welcome back!", { type: "success" });
      return { ok: true };
    },
    {
      loading: "Signing you in...",
      success: "Logged in successfully!",
      error: "Login failed. Please try again.",
    }
  ).catch((err: any): AuthResult => {
    const code = err?.code || "";
    if (err?.status === 404 || code === "auth/user-not-found") {
      toastMessage("No account found. Redirecting to signup...", {
        type: "warning",
      });
      setTimeout(() => (window.location.href = "/signup"), 1200);
      return { ok: false, message: "User not found." };
    }

    if (err?.status === 403) {
      toastMessage("Please verify your email before logging in.", {
        type: "warning",
      });
      return { ok: false, message: "Email not verified." };
    }

    const msg = err?.message || "Login failed.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  });

  return result ?? { ok: false, message: "Unexpected login error." };
}

/* ============================================================
   🔁 Password Reset
============================================================ */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const result = await toastAsync(
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
  ).catch((err: any): AuthResult => {
    const code = err?.code || "";
    if (code === "auth/user-not-found") {
      toastMessage("No account found with that email.", { type: "warning" });
      return { ok: false, message: "User not found." };
    }

    if (code === "auth/invalid-email") {
      toastMessage("Please enter a valid email.", { type: "error" });
      return { ok: false, message: "Invalid email." };
    }

    const msg = err?.message || "Reset failed.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  });

  return result ?? { ok: false, message: "Unexpected reset error." };
}

/* ============================================================
   ✉️ Resend Verification Email
============================================================ */
export async function resendVerificationEmail(): Promise<AuthResult> {
  const user = auth.currentUser;
  if (!user) {
    toastMessage("Please log in again first.", { type: "error" });
    setTimeout(() => (window.location.href = "/login"), 1200);
    return { ok: false, message: "No current user." };
  }

  const result = await toastAsync(
    async () => {
      await sendEmailVerification(user);
      toastMessage("Verification link sent successfully!", {
        type: "success",
      });
      return { ok: true };
    },
    {
      loading: "Sending verification email...",
      success: "Verification link sent successfully!",
      error: "Failed to resend verification email.",
    }
  ).catch((err: any): AuthResult => {
    const code = err?.code || "";
    if (code === "auth/too-many-requests") {
      toastMessage(
        "You’ve requested too many verification emails. Try again later.",
        { type: "warning" }
      );
      return { ok: false, message: "Too many requests." };
    }

    const msg = err?.message || "Something went wrong.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  });

  return result ?? { ok: false, message: "Unexpected resend error." };
}
