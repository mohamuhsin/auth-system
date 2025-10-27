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
   Shared types & helpers
============================================================ */
export interface AuthResult {
  ok: boolean;
  message?: string;
}

function normalizeApi(res: any): {
  ok: boolean;
  status?: number;
  message?: string;
} {
  if (res && typeof res === "object" && "ok" in res && "status" in res) {
    return { ok: !!res.ok, status: Number(res.status), message: undefined };
  }
  if (res && typeof res === "object") {
    const statusStr = (res.status ?? res.statusText) as string | undefined;
    const statusNum =
      typeof res.statusCode === "number" ? res.statusCode : undefined;
    const ok =
      statusStr === "success" ||
      (typeof statusNum === "number" && statusNum >= 200 && statusNum < 300);
    return { ok, status: statusNum, message: res.message };
  }
  return { ok: false, status: undefined, message: undefined };
}

function go(path: string, delay = 800) {
  setTimeout(() => {
    if (typeof window !== "undefined") window.location.href = path;
  }, delay);
}

/* ============================================================
   🆕 Signup — Email + Password
============================================================ */
export async function signupWithEmailPassword(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  try {
    const result = await toastAsync(
      async () => {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await sendEmailVerification(cred.user);

        const idToken = await cred.user.getIdToken(true);
        const raw = await apiRequest("/auth/signup-with-firebase", {
          method: "POST",
          credentials: "include",
          body: { idToken, name },
        });
        const res = normalizeApi(raw);

        // Handle backend 202 (pending verification)
        if (res.status === 202) {
          await signOut(auth);
          toastMessage(
            "✅ Account created! Please verify your email before logging in.",
            { type: "success" }
          );
          go(`/verify-email?email=${encodeURIComponent(email)}`, 1200);
          return { ok: true, message: "Verification pending." };
        }

        if (res.ok) {
          toastMessage("🎉 Account created successfully!", { type: "success" });
          go("/dashboard", 900);
          return { ok: true };
        }

        if (res.status === 409) {
          toastMessage("Account already exists. Redirecting to login...", {
            type: "warning",
          });
          go("/login", 1200);
          return { ok: false, message: "Account already exists." };
        }

        return {
          ok: false,
          message: res.message || "Signup failed. Please try again.",
        };
      },
      {
        loading: "Creating your account...",
        success: "Account created!",
        error: "Signup failed.",
      }
    );

    return result ?? { ok: false, message: "Unexpected signup result." };
  } catch (err: any) {
    const code = err?.code as string | undefined;

    if (code === "auth/email-already-in-use") {
      toastMessage("Account already exists. Redirecting to login...", {
        type: "warning",
      });
      go("/login", 1200);
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
  }
}

/* ============================================================
   🔑 Login — Email + Password
============================================================ */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const result = await toastAsync(
      async () => {
        const cred = await signInWithEmailAndPassword(auth, email, password);

        if (!cred.user.emailVerified) {
          await signOut(auth);
          toastMessage("Please verify your email before signing in.", {
            type: "warning",
          });
          go(`/verify-email?email=${encodeURIComponent(email)}`, 800);
          return { ok: false, message: "Email not verified." };
        }

        const idToken = await cred.user.getIdToken(true);
        const raw = await apiRequest("/auth/login-with-firebase", {
          method: "POST",
          credentials: "include",
          body: { idToken },
        });
        const res = normalizeApi(raw);

        if (res.status === 403) {
          toastMessage("Please verify your email before logging in.", {
            type: "warning",
          });
          go(`/verify-email?email=${encodeURIComponent(email)}`, 800);
          return { ok: false, message: "Email not verified." };
        }

        if (res.status === 404) {
          toastMessage("No account found. Redirecting to signup...", {
            type: "warning",
          });
          go("/signup", 1200);
          return { ok: false, message: "User not found." };
        }

        if (!res.ok) {
          return { ok: false, message: res.message || "Login failed." };
        }

        toastMessage("🎉 Welcome back!", { type: "success" });
        go("/dashboard", 500);
        return { ok: true };
      },
      {
        loading: "Signing you in...",
        success: "Logged in successfully!",
        error: "Login failed.",
      }
    );

    return result ?? { ok: false, message: "Unexpected login result." };
  } catch (err: any) {
    const msg = err?.message || "Login failed.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}

/* ============================================================
   🔁 Password Reset
============================================================ */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const result = await toastAsync(
      async () => {
        await sendPasswordResetEmail(auth, email);
        toastMessage("📨 Password reset link sent! Check your inbox.", {
          type: "success",
        });
        return { ok: true };
      },
      {
        loading: "Sending password reset email...",
        success: "Reset email sent!",
        error: "Failed to send reset email.",
      }
    );

    return result ?? { ok: false, message: "Unexpected reset result." };
  } catch (err: any) {
    const code = err?.code as string | undefined;
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
  }
}

/* ============================================================
   ✉️ Resend Verification Email
============================================================ */
export async function resendVerificationEmail(): Promise<AuthResult> {
  const user = auth.currentUser;

  if (!user) {
    toastMessage("Please log in again first.", { type: "error" });
    go("/login", 1000);
    return { ok: false, message: "No current user." };
  }

  try {
    const result = await toastAsync(
      async () => {
        await sendEmailVerification(user);
        toastMessage("📧 Verification link sent successfully!", {
          type: "success",
        });
        return { ok: true };
      },
      {
        loading: "Sending verification email...",
        success: "Verification email sent!",
        error: "Failed to resend verification email.",
      }
    );

    return result ?? { ok: false, message: "Unexpected resend result." };
  } catch (err: any) {
    const code = err?.code as string | undefined;
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
  }
}
