/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getIdToken, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toastAsync } from "@/lib/toast";
import type { User } from "@/types/user";

interface ApiResponse {
  status: string;
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
     🟦 Fetch current session (/users/me)
  ============================================================ */
  const fetchSession = async () => {
    try {
      const res = await apiRequest<ApiResponse>("/users/me");

      if (res.status === "success" && res.email) {
        // ✅ Validate role type strictly
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
      console.warn("Session fetch failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  /* ============================================================
     🔑 Login — exchange Firebase ID token for session cookie
  ============================================================ */
  const loginWithFirebase = async (firebaseUser: any): Promise<ApiResponse> => {
    const idToken = await getIdToken(firebaseUser, true);

    const response = await apiRequest<ApiResponse>("/auth/session", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });

    // Refresh profile after session is set
    await fetchSession();

    return response;
  };

  /* ============================================================
     🚪 Logout — clears backend + Firebase + redirect to /login
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
     🔄 Manual refresh (optional)
  ============================================================ */
  const refreshSession = async () => fetchSession();

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithFirebase, logout, refreshSession }}
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
