"use client";

/* ============================================================
   ✉️ VerifyEmailNotice — Post-Signup Email Verification Screen
   ------------------------------------------------------------
   • Confirms verification email was sent
   • Allows resending using centralized helper
   • Auto-checks and redirects once verified
   • Smooth production-safe UX
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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MailCheck, MailWarning, Loader2 } from "lucide-react";

export function VerifyEmailNotice() {
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep a ref to the polling timer so we can safely clear it
  const pollRef = useRef<number | null>(null);

  // Helper to clear existing poll interval
  const clearPoll = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  /* ============================================================
     🧭 Initialize user + auto-check verification
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

      // Use Firebase user's email if no param provided
      if (!emailParam && user.email) setUserEmail(user.email);

      try {
        await user.reload();
      } catch {
        // safely ignore reload errors
      }

      if (user.emailVerified) {
        toastMessage("✅ Your email has been verified!", { type: "success" });
        setTimeout(() => router.replace("/dashboard"), 800);
        return;
      }

      // Start polling every 5 seconds
      pollRef.current = window.setInterval(async () => {
        const current = auth.currentUser;
        if (!current) {
          clearPoll();
          setChecking(false);
          return;
        }

        try {
          await current.reload();
        } catch {
          // ignore reload errors
        }

        if (current.emailVerified) {
          clearPoll();
          toastMessage("🎉 Email verified! Redirecting...", {
            type: "success",
          });
          router.replace("/dashboard");
        }
      }, 5000) as unknown as number;

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
    if (!auth.currentUser) {
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
     🧩 UI
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
      <Card className="w-full max-w-sm border border-border/60 bg-background/95 shadow-md backdrop-blur">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <MailCheck className="size-10 text-primary" />
          </div>

          <CardTitle className="font-display text-xl">
            Verify your email
          </CardTitle>

          <CardDescription className="mt-2 text-sm leading-relaxed">
            We’ve sent a verification link{" "}
            {userEmail ? (
              <>
                to <span className="text-primary font-medium">{userEmail}</span>
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
            className="w-full"
            variant="outline"
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
    </main>
  );
}
