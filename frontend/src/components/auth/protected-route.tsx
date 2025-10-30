"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/authContext";

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
  const safetyTimer = useRef<NodeJS.Timeout | null>(null);
  const [safetyTriggered, setSafetyTriggered] = useState(false);

  useEffect(() => {
    if (!loading && !user && !redirectedRef.current) {
      redirectedRef.current = true;
      const timeout = setTimeout(() => {
        console.info("🔒 Redirecting to login after logout/session expiry.");
        router.replace(redirectTo);
      }, 250);
      return () => clearTimeout(timeout);
    }
  }, [user, loading, router, redirectTo]);
  useEffect(() => {
    if (safetyTimer.current) clearTimeout(safetyTimer.current);

    if (loading) {
      safetyTimer.current = setTimeout(async () => {
        console.warn("⚠️ Auth verification timeout — forcing manual recheck.");
        setSafetyTriggered(true);

        try {
          await waitForSession?.();
        } catch {}

        if (!user && !redirectedRef.current) {
          redirectedRef.current = true;
          router.replace(redirectTo);
        }
      }, 5000);
    }

    return () => {
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    };
  }, [loading, user, router, redirectTo, waitForSession]);
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

  if (user) return <>{children}</>;
  if (!redirectedRef.current) {
    redirectedRef.current = true;
    router.replace(redirectTo);
  }
  return null;
}
