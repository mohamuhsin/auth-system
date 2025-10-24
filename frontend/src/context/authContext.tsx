/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getIdToken, signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toastAsync } from "@/lib/toast";
import type { User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithFirebase: (firebaseUser: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ============================================================
     🟦 Fetch current session (GET /users/me)
  ============================================================ */
  const fetchSession = async () => {
    try {
      const data = await apiRequest<User>("/users/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  /* ============================================================
     🔑 Login — exchange Firebase ID token → backend session cookie
  ============================================================ */
  const loginWithFirebase = async (firebaseUser: any) => {
    await toastAsync(
      async () => {
        const idToken = await getIdToken(firebaseUser, true);

        await apiRequest("/auth/session", {
          method: "POST",
          body: JSON.stringify({ idToken }),
        });

        await fetchSession();
      },
      {
        loading: "Signing you in...",
        success: "Logged in successfully",
        error: "Login failed",
      }
    );
  };

  /* ============================================================
     🚪 Logout — clear backend session + Firebase logout
  ============================================================ */
  const logout = async () => {
    await toastAsync(
      async () => {
        await apiRequest("/auth/logout", { method: "POST" });
        await signOut(auth);
        setUser(null);
      },
      {
        loading: "Logging out...",
        success: "Logged out successfully",
        error: "Logout failed",
      }
    );
  };

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
   Ensures context is only used inside AuthProvider.
============================================================ */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
