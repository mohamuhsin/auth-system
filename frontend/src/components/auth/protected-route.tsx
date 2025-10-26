"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/authContext";

/* ============================================================
   🔒 ProtectedRoute — Guards private pages (with fade loader)
   ------------------------------------------------------------
   • Waits for AuthContext to finish loading
   • Redirects safely with timeout fallback
   • Prevents infinite "verifying session..." stuck states
============================================================ */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
  fallbackText = "Verifying your session...",
}: {
  children: React.ReactNode;
  redirectTo?: string;
  fallbackText?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🧭 Handle redirect if no user after loading
  useEffect(() => {
    // Avoid multiple redirects
    if (!loading && !user && !redirectedRef.current) {
      redirectedRef.current = true;
      const timeout = setTimeout(() => router.replace(redirectTo), 200);
      return () => clearTimeout(timeout);
    }
  }, [user, loading, router, redirectTo]);

  // 🕓 Safety fallback — if still loading too long (10s), force reset
  useEffect(() => {
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    // only start safety timer if still loading
    if (loading) {
      safetyTimeoutRef.current = setTimeout(() => {
        console.warn("⚠️ Auth verification timeout — redirecting to login.");
        redirectedRef.current = true;
        router.replace(redirectTo);
      }, 10000); // 10 seconds
    }

    return () => {
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [loading, router, redirectTo]);

  // 🌀 While verifying session
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        <AnimatePresence mode="wait">
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-2"
          >
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm font-medium">{fallbackText}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ✅ Authenticated — render protected content
  return <>{children}</>;
}
