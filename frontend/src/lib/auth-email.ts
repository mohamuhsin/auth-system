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
import { toast, toastMessage } from "@/lib/toast";

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
    return { ok: !!res.ok, status: Number(res.status) };
  }
  if (res && typeof res === "object") {
    const statusNum =
      typeof res.code === "number"
        ? res.code
        : typeof res.statusCode === "number"
        ? res.statusCode
        : typeof res.status === "number"
        ? res.status
        : undefined;
    const statusStr = res.status ?? res.statusText;
    const ok =
      statusStr === "success" ||
      (typeof statusNum === "number" && statusNum >= 200 && statusNum < 300);
    return { ok, status: statusNum, message: res.message };
  }
  return { ok: false };
}

function go(path: string, delay = 800) {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    try {
      window.location.replace(path);
    } catch {
      window.location.href = path;
    }
  }, delay);
}

const actionCodeSettings =
  typeof window !== "undefined"
    ? {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      }
    : undefined;

/* ============================================================
   ✳️ SIGNUP
============================================================ */
export async function signupWithEmailPassword(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Creating your account...", { type: "loading" });

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user, actionCodeSettings);

    const idToken = await cred.user.getIdToken(true);
    const raw = await apiRequest("/auth/signup-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken, name },
    });
    const res = normalizeApi(raw);

    toast.dismiss();

    if (res.status === 409) {
      toastMessage("Account already exists. Redirecting to login...", {
        type: "warning",
      });
      go("/login", 1200);
      return { ok: false, message: "Account already exists." };
    }

    if (res.status === 403 || res.status === 202) {
      toastMessage("Verify your email before logging in.", { type: "info" });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 1200);
      return { ok: true, message: "Verification pending." };
    }

    if (res.ok) {
      toastMessage("Account created successfully.", { type: "success" });
      go("/dashboard", 900);
      return { ok: true };
    }

    toastMessage(res.message || "Unexpected error occurred.", {
      type: "error",
    });
    return { ok: false, message: res.message || "Signup failed." };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;

    switch (code) {
      case "auth/email-already-in-use":
        toastMessage("Account already exists. Redirecting to login...", {
          type: "warning",
        });
        go("/login", 1200);
        return { ok: false, message: "Account already exists." };

      case "auth/invalid-email":
        toastMessage("Invalid email address.", { type: "error" });
        return { ok: false, message: "Invalid email." };

      case "auth/weak-password":
        toastMessage("Weak password. Try a stronger one.", { type: "warning" });
        return { ok: false, message: "Weak password." };

      default:
        const msg =
          err?.data?.message || err?.message || "Unexpected error occurred.";
        if (msg.includes("already")) {
          toastMessage("Account already exists. Redirecting to login...", {
            type: "warning",
          });
          go("/login", 1200);
          return { ok: false, message: "Account already exists." };
        }
        toastMessage(msg, { type: "error" });
        return { ok: false, message: msg };
    }
  }
}

/* ============================================================
   🔑 LOGIN
============================================================ */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Signing you in...", { type: "loading" });

    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (!cred.user.emailVerified) {
      await signOut(auth);
      toast.dismiss();
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

    toast.dismiss();

    if (res.status === 403 || res.status === 202) {
      toastMessage("Account created! Please verify your email to continue.", {
        type: "success",
      });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 1200);
      return { ok: true, message: "Verification pending." };
    }

    if (res.status === 404) {
      toastMessage("No account exists. Redirecting to signup...", {
        type: "warning",
      });
      go("/signup", 1000);
      return { ok: false, message: "No account exists." };
    }

    if (!res.ok) {
      toastMessage(res.message || "Login failed.", { type: "error" });
      return { ok: false, message: res.message || "Login failed." };
    }

    toastMessage("Welcome back.", { type: "success" });
    go("/dashboard", 600);
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();

    const code = err?.code as string;
    let msg = "Login failed. Please try again.";

    switch (code) {
      case "auth/invalid-email":
        msg = "Invalid email format. Please check and try again.";
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        msg = "Invalid email or password. Please try again.";
        break;
      case "auth/too-many-requests":
        msg = "Too many failed attempts. Please wait and try again later.";
        break;
      case "auth/network-request-failed":
        msg = "Network error. Please check your connection.";
        break;
      default:
        msg =
          err?.data?.message ||
          err?.message ||
          "Unexpected error. Please try again.";
    }

    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}

/* ============================================================
   🔁 PASSWORD RESET
============================================================ */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Sending password reset link...", { type: "loading" });

    await sendPasswordResetEmail(auth, email);

    toast.dismiss();
    toastMessage(
      "Password reset link sent successfully. Check your inbox and follow the link to set a new password.",
      { type: "success" }
    );

    return { ok: true, message: "Reset email sent." };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;

    switch (code) {
      case "auth/user-not-found":
        toastMessage("No account found with that email.", { type: "warning" });
        return { ok: false, message: "User not found." };

      case "auth/invalid-email":
        toastMessage("Please enter a valid email address.", { type: "error" });
        return { ok: false, message: "Invalid email." };

      default:
        const msg = err?.message || "Failed to send reset link.";
        toastMessage(msg, { type: "error" });
        return { ok: false, message: msg };
    }
  }
}

/* ============================================================
   ✉️ RESEND VERIFICATION
============================================================ */
export async function resendVerificationEmail(): Promise<AuthResult> {
  const user = auth.currentUser;

  if (!user) {
    toast.dismiss();
    toastMessage(
      "We couldn’t resend the verification email because your signup session expired. Please sign in again to request a new link.",
      { type: "warning" }
    );
    go("/login", 1500);
    return { ok: false, message: "Session expired. Please sign in again." };
  }

  try {
    toast.dismiss();
    toastMessage("Sending verification email...", { type: "loading" });
    await sendEmailVerification(user, actionCodeSettings);
    toast.dismiss();
    toastMessage("Verification link sent successfully.", { type: "success" });
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;

    if (code === "auth/too-many-requests") {
      toastMessage("Too many verification attempts. Try again later.", {
        type: "warning",
      });
      return { ok: false, message: "Too many requests." };
    }

    if (code === "auth/requires-recent-login") {
      toastMessage("Please log in again to resend the email.", {
        type: "warning",
      });
      go("/login", 1200);
      return { ok: false, message: "Requires recent login." };
    }

    const msg = err?.message || "Something went wrong.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}
