"use client";

/* ============================================================
   ✉️ VerifyEmailNotice — Post-Signup Verification Screen
   ------------------------------------------------------------
   • Confirms verification email was sent
   • Allows resending (via helper)
   • Auto-polls Firebase until verified
   • Smooth & consistent with Auth UI design
============================================================ */

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";
import { resendVerificationEmail } from "@/lib/auth-email";
import { toastMessage } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, MailCheck, MailWarning } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ============================================================
   🧩 Component
============================================================ */
export function VerifyEmailNotice() {
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Safely clear polling interval */
  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  /* ============================================================
     🧭 Initialize user + Auto-poll verification
  ============================================================ */
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setUserEmail(emailParam);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearPoll();

      if (!user) {
        setChecking(false);
        return;
      }

      if (!emailParam && user.email) setUserEmail(user.email);

      try {
        await user.reload();
      } catch {
        // Ignore reload errors (network, etc.)
      }

      // ✅ Already verified
      if (user.emailVerified) {
        toastMessage("✅ Your email has been verified!", { type: "success" });
        setTimeout(() => router.replace("/dashboard"), 800);
        return;
      }

      // 🔁 Start polling every 5 seconds until verified
      pollRef.current = setInterval(async () => {
        const current = auth.currentUser;
        if (!current) {
          clearPoll();
          setChecking(false);
          return;
        }

        try {
          await current.reload();
        } catch {
          return; // ignore
        }

        if (current.emailVerified) {
          clearPoll();
          toastMessage("🎉 Email verified! Redirecting...", {
            type: "success",
          });
          router.replace("/dashboard");
        }
      }, 5000);

      setChecking(false);
    });

    return () => {
      clearPoll();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* ============================================================
     🔁 Resend Verification Email
  ============================================================ */
  const handleResend = async () => {
    const current = auth.currentUser;

    if (!current) {
      toastMessage("You need to be signed in to resend verification.", {
        type: "error",
      });
      return;
    }

    try {
      setResending(true);
      const res = await resendVerificationEmail();
      if (res.ok) {
        toastMessage("📧 Verification email resent successfully.", {
          type: "success",
        });
      } else {
        toastMessage(res.message || "Failed to resend verification email.", {
          type: "error",
        });
      }
    } catch {
      toastMessage("Failed to resend verification email.", { type: "error" });
    } finally {
      setResending(false);
    }
  };

  /* ============================================================
     🧩 UI — Consistent with Login / Signup design
  ============================================================ */
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key="verify-card"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm"
        >
          <Card className="border border-border/60 bg-background/95 shadow-md backdrop-blur">
            <CardHeader className="text-center">
              <div className="mb-3 flex justify-center">
                <MailCheck className="size-10 text-primary" />
              </div>
              <CardTitle className="font-display text-xl">
                Verify your email
              </CardTitle>
              <CardDescription className="mt-2 text-sm leading-relaxed">
                We’ve sent a verification link{" "}
                {userEmail ? (
                  <>
                    to{" "}
                    <span className="font-medium text-primary">
                      {userEmail}
                    </span>
                  </>
                ) : (
                  "to your registered email address"
                )}
                . <br />
                Please check your inbox and confirm to activate your account.
              </CardDescription>
            </CardHeader>

            <CardContent className="mt-2 flex flex-col items-center gap-4">
              <Button
                onClick={handleResend}
                disabled={resending}
                variant="outline"
                className="w-full"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <MailWarning className="mr-2 size-4" /> Resend verification
                    email
                  </>
                )}
              </Button>

              <Link
                href="/login"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Back to Login
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
