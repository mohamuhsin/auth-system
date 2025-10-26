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
   🌐 AuthProvider — manages global user session
============================================================ */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* ============================================================
     🧩 Fetch Session from Backend
  ============================================================ */
  const fetchSession = useCallback(async (retries = 2) => {
    try {
      const res = await apiRequest<ApiResponse>("/users/me");

      if (res?.status === "success" && res.email) {
        const validRoles = ["USER", "ADMIN", "CREATOR", "MERCHANT"] as const;
        const role = validRoles.includes(res.role as any)
          ? (res.role as User["role"])
          : "USER";

        const newUser: User = {
          id: res.id || "unknown",
          firebaseUid: res.uid || "unknown",
          email: res.email,
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
      console.warn("Session fetch failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============================================================
     🚀 Initialize session on mount
  ============================================================ */
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  /* ============================================================
     🔑 Login — Firebase → Backend cookie session
  ============================================================ */
  const loginWithFirebase = async (firebaseUser: any): Promise<ApiResponse> => {
    const idToken = await getIdToken(firebaseUser, true);

    const res = await apiRequest<ApiResponse>("/auth/login-with-firebase", {
      method: "POST",
      body: { idToken, userAgent: navigator.userAgent },
    });

    await fetchSession();
    return { ...res, status: res.status ?? "success" };
  };

  /* ============================================================
     🆕 Signup — Firebase → Backend user creation
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

    await fetchSession();
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
     🌍 Context Provider
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
