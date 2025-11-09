"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/authContext";

/* ============================================================
   🔐 ProtectedRoute — Auth Gate (Final v3.2)
   ------------------------------------------------------------
   • Prevents access to protected pages
   • Waits for session cookie + user context
   • Gracefully probes backend after 4s delay
   • Works for both Google & Email sessions
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
  const [verifying, setVerifying] = useState(true);
  const redirected = useRef(false);

  /* ------------------------------------------------------------
     🚧 Redirect guests (no session cookie)
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!loading && !user && !redirected.current) {
      redirected.current = true;
      console.info("🔒 No active session — redirecting to login.");
      const timeout = setTimeout(() => router.replace(redirectTo), 300);
      return () => clearTimeout(timeout);
    }

    // Reset flag if user appears again (e.g., after login)
    if (user) redirected.current = false;
  }, [user, loading, router, redirectTo]);

  /* ------------------------------------------------------------
     🕐 Safety probe (handles stuck 'loading' states)
     Forces a /users/me call via waitForSession() if still loading
  ------------------------------------------------------------ */
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (loading && verifying) {
        console.warn("⚠️ Slow session load — triggering manual probe...");
        try {
          await waitForSession?.();
        } catch (err) {
          console.error("waitForSession probe failed:", err);
        } finally {
          setVerifying(false);
        }
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [loading, verifying, waitForSession]);

  /* ------------------------------------------------------------
     🎬 Fallback Loader (while verifying)
  ------------------------------------------------------------ */
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

  /* ------------------------------------------------------------
     🚫 No user (after probe)
  ------------------------------------------------------------ */
  if (!user && !loading) return null;

  /* ------------------------------------------------------------
     ✅ Authorized — render content
  ------------------------------------------------------------ */
  return <>{children}</>;
}
