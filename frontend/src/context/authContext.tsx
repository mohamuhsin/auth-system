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
  statusCode?: number;
  message?: string;
  uid?: string;
  firebaseUid?: string;
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string;
  isApproved?: boolean;
  createdAt?: string;
  updatedAt?: string;
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

/* ============================================================
   ⚙️ Context Initialization
============================================================ */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ============================================================
   🌐 AuthProvider — manages global user session
============================================================ */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* ============================================================
     🟦 Fetch current session (/users/me)
     - Wrapped in useCallback to keep it stable across renders
  ============================================================ */
  const fetchSession = useCallback(async (retries = 2) => {
    try {
      const res = await apiRequest<ApiResponse>("/users/me");

      if (res.status === "success" && res.email) {
        const validRoles = ["USER", "ADMIN", "CREATOR", "MERCHANT"] as const;
        const normalizedRole = validRoles.includes(res.role as any)
          ? (res.role as User["role"])
          : "USER";

        const newUser: User = {
          id: res.uid || res.firebaseUid || "unknown",
          firebaseUid: res.firebaseUid || res.uid || "unknown",
          email: res.email,
          name: res.name || null,
          avatarUrl: res.avatarUrl || null,
          role: normalizedRole,
          isApproved: res.isApproved ?? false,
          createdAt: res.createdAt || new Date().toISOString(),
          updatedAt: res.updatedAt || new Date().toISOString(),
        };

        setUser(newUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      if (retries > 0) {
        console.warn("Retrying session fetch...");
        return fetchSession(retries - 1);
      }
      console.warn("Session fetch failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============================================================
     🧠 Initialize session on mount
  ============================================================ */
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  /* ============================================================
     🔑 Login — Backend-verified Firebase session cookie
  ============================================================ */
  const loginWithFirebase = async (firebaseUser: any): Promise<ApiResponse> => {
    const idToken = await getIdToken(firebaseUser, true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login-with-firebase`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ allows cookies
        body: JSON.stringify({
          idToken,
          userAgent: navigator.userAgent,
        }),
      }
    );

    const data: ApiResponse = await res.json().catch(() => ({}));

    if (res.status === 404)
      return { status: "error", statusCode: 404, message: "NOT_FOUND" };

    if (!res.ok)
      return {
        status: "error",
        statusCode: res.status,
        message: data?.message || "Login failed.",
      };

    await fetchSession();
    return { ...data, status: data.status ?? "success" };
  };

  /* ============================================================
     🟢 Signup — Backend-verified Firebase session cookie
  ============================================================ */
  const signupWithFirebase = async (
    firebaseUser: any,
    extra?: { name?: string; avatarUrl?: string }
  ): Promise<ApiResponse> => {
    const idToken = await getIdToken(firebaseUser, true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup-with-firebase`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ cookie session cross-domain
        body: JSON.stringify({
          idToken,
          userAgent: navigator.userAgent,
          ...extra,
        }),
      }
    );

    const data: ApiResponse = await res.json().catch(() => ({}));

    if (res.status === 409)
      return { status: "error", statusCode: 409, message: "ALREADY_EXISTS" };

    if (!res.ok)
      return {
        status: "error",
        statusCode: res.status,
        message: data?.message || "Signup failed.",
      };

    await fetchSession();
    return { ...data, status: data.status ?? "success" };
  };

  /* ============================================================
     🚪 Logout — Clears backend + Firebase + redirects to /login
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
     🔄 Manual Refresh (optional)
  ============================================================ */
  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  /* ============================================================
     🧩 Provide Context
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
   🪶 Hook: useAuth
============================================================ */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
