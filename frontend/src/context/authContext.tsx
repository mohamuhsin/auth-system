/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getIdToken, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toastAsync } from "@/lib/toast";
import type { User } from "@/types/user";

/* ============================================================
   📦 API Response Type
============================================================ */
interface ApiResponse {
  status?: string;
  message?: string;
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string;
  isApproved?: boolean;
  statusCode?: number;
  uid?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  error?: string;
}

/* ============================================================
   🧠 Auth Context Types
============================================================ */
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithFirebase: (firebaseUser: any) => Promise<ApiResponse>;
  signupWithFirebase: (
    firebaseUser: any,
    extra?: { name?: string; avatarUrl?: string }
  ) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ============================================================
   🌍 AuthProvider — Global Auth State Manager
============================================================ */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* ============================================================
     🧩 Fetch Session — Verify Cookie from Backend
  ============================================================ */
  const fetchSession = useCallback(async (retries = 2) => {
    try {
      const res = await apiRequest<ApiResponse>("/users/me");

      if ((res?.status === "success" || res?.email) && !res?.error) {
        const validRoles = ["USER", "ADMIN", "CREATOR", "MERCHANT"] as const;
        const role = validRoles.includes(res.role as any)
          ? (res.role as User["role"])
          : "USER";

        const newUser: User = {
          id: res.id || "unknown",
          firebaseUid: res.uid || "unknown",
          email: res.email ?? "",
          name: res.name || null,
          avatarUrl: res.avatarUrl || null,
          role,
          isApproved: res.isApproved ?? false,
          createdAt: res.createdAt || new Date().toISOString(),
          updatedAt: res.updatedAt || new Date().toISOString(),
        };

        setUser(newUser);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      if (retries > 0) {
        console.warn("Retrying session fetch...");
        return fetchSession(retries - 1);
      }
      console.warn("❌ Session fetch failed:", err.message || err);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("✅ Auth state initialized — session checked");
    }
  }, []);

  /* ============================================================
     🚀 Initialize Session on Mount
  ============================================================ */
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  /* ============================================================
     🔑 Login — Firebase → Backend Cookie Session
  ============================================================ */
  const loginWithFirebase = async (firebaseUser: any): Promise<ApiResponse> => {
    const idToken = await getIdToken(firebaseUser, true);

    const res = await apiRequest<ApiResponse>("/auth/login-with-firebase", {
      method: "POST",
      body: { idToken, userAgent: navigator.userAgent },
    });

    // Wait briefly for cookie to propagate
    await new Promise((r) => setTimeout(r, 600));
    await fetchSession();

    router.replace("/dashboard");
    return { ...res, status: res.status ?? "success" };
  };

  /* ============================================================
     🆕 Signup — Firebase → Backend Cookie Session + Verify Redirect
  ============================================================ */
  const signupWithFirebase = async (
    firebaseUser: any,
    extra?: { name?: string; avatarUrl?: string }
  ): Promise<ApiResponse> => {
    const idToken = await getIdToken(firebaseUser, true);

    const res = await apiRequest<ApiResponse>("/auth/signup-with-firebase", {
      method: "POST",
      body: { idToken, userAgent: navigator.userAgent, ...extra },
    });

    // Wait before checking cookie
    await new Promise((r) => setTimeout(r, 600));
    await fetchSession();

    // 🚦 Redirect based on email verification state
    if (!firebaseUser.emailVerified) {
      try {
        await firebaseUser.sendEmailVerification();
        console.log("📧 Verification email sent to", firebaseUser.email);
      } catch (err: any) {
        console.warn("⚠️ Failed to send verification email:", err.message);
      }
      router.replace("/verify-email");
    } else {
      router.replace("/dashboard");
    }

    return { ...res, status: res.status ?? "success" };
  };

  /* ============================================================
     🚪 Logout — Backend + Firebase + Router
  ============================================================ */
  const logout = async () => {
    await toastAsync(
      async () => {
        await apiRequest("/auth/logout", { method: "POST" });
        await signOut(auth);
        setUser(null);
        router.replace("/login");
      },
      {
        loading: "Logging out...",
        success: "Logged out successfully",
        error: "Logout failed. Please try again.",
      }
    );
  };

  /* ============================================================
     🔁 Manual Session Refresh (optional)
  ============================================================ */
  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  /* ============================================================
     🌍 Provide Context Globally
  ============================================================ */
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithFirebase,
        signupWithFirebase,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ============================================================
   🪶 useAuth Hook
============================================================ */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
