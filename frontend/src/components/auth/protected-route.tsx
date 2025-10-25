"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/authContext";

/* ============================================================
   🔒 ProtectedRoute — Guards private pages (with fade loader)
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

  // 🧭 Redirect if no session and loading completed
  useEffect(() => {
    if (!loading && !user) {
      // Short delay prevents UI flicker on route transitions
      const timeout = setTimeout(() => router.replace(redirectTo), 200);
      return () => clearTimeout(timeout);
    }
  }, [user, loading, router, redirectTo]);

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
