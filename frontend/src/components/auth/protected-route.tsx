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
  const [verifying, setVerifying] = useState(true);
  const redirected = useRef(false);

  // ✅ Handle redirect after logout or session expiry
  useEffect(() => {
    if (!loading && !user && !redirected.current) {
      redirected.current = true;
      console.info("🔒 No user — redirecting to login.");
      router.replace(redirectTo);
    } else if (user) {
      redirected.current = false; // reset flag once user logs in again
    }
  }, [user, loading, router, redirectTo]);

  // ✅ Safety fallback if Firebase takes too long to verify
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (loading && verifying) {
        console.warn("⚠️ Verification delay — forcing session probe.");
        try {
          await waitForSession?.();
        } catch {}
        setVerifying(false);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [loading, verifying, waitForSession]);

  if (loading && verifying) {
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

  if (!user && !loading) return null;
  return <>{children}</>;
}
