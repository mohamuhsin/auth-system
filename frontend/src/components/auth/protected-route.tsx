"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/authContext";

/* ============================================================
   🔒 ProtectedRoute — Level 2.8 (Final Polished)
   ------------------------------------------------------------
   ✅ Fixes “stuck verifying session after logout”
   ✅ Adds timeout + forced session recheck
   ✅ Prevents infinite loading loops
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
  const { user, loading, waitForSession } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [safetyTriggered, setSafetyTriggered] = useState(false);

  /* 🧭 Redirect to login if not authenticated */
  useEffect(() => {
    if (!loading && !user && !redirectedRef.current) {
      redirectedRef.current = true;
      const timeout = setTimeout(() => router.replace(redirectTo), 300);
      return () => clearTimeout(timeout);
    }
  }, [user, loading, router, redirectTo]);

  /* 🕓 Safety fallback (5s max) — recheck session, then redirect */
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (loading) {
      timeoutRef.current = setTimeout(async () => {
        console.warn("⚠️ Auth verification timeout — forcing recheck.");
        setSafetyTriggered(true);
        try {
          await waitForSession?.(); // 🩵 probe backend or Firebase again
        } catch {
          // ignore
        }

        // If still no user, redirect
        if (!user) {
          redirectedRef.current = true;
          router.replace(redirectTo);
        }
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading, user, router, redirectTo, waitForSession]);

  /* 🌀 While verifying session */
  if (loading && !safetyTriggered) {
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

  /* ✅ Authenticated — render protected content */
  if (user) return <>{children}</>;

  /* 🚫 Fallback — if all fails, redirect */
  router.replace(redirectTo);
  return null;
}
