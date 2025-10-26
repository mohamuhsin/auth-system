"use client";

/* ============================================================
   ✉️ VerifyEmailNotice — Post-Signup Email Verification Screen
   ------------------------------------------------------------
   • Confirms verification email was sent
   • Allows resending using centralized helper
   • Auto-redirects once verified
   • Production-safe feedback + retry flow
============================================================ */

import { useState, useEffect } from "react";
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ============================================================
     🧭 Initialize user + auto-check verification
  ============================================================ */
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setUserEmail(emailParam);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setChecking(false);
        return;
      }

      if (!emailParam && user.email) setUserEmail(user.email);

      try {
        // Refresh Firebase user to check current verification state
        await user.reload();

        if (user.emailVerified) {
          toastMessage("✅ Your email has been verified!", { type: "success" });
          setTimeout(() => router.replace("/login"), 1000);
          return;
        }
      } catch (err) {
        console.error("Error checking verification:", err);
      }

      setChecking(false);
    });

    return () => unsubscribe();
  }, [router, searchParams]);

  /* ============================================================
     🔁 Resend Verification Email
  ============================================================ */
  const handleResend = async () => {
    try {
      setResending(true);
      const result = await resendVerificationEmail();
      if (result?.ok) {
        toastMessage("Verification email resent successfully.", {
          type: "success",
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
      <Card className="w-full max-w-sm border border-border/60 shadow-md bg-background/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <MailCheck className="size-10 text-primary" />
          </div>

          <CardTitle className="text-xl font-display">
            Verify your email
          </CardTitle>

          <CardDescription className="mt-2 text-sm">
            We’ve sent a verification link{" "}
            {userEmail ? (
              <>
                to <span className="font-medium text-primary">{userEmail}</span>
              </>
            ) : (
              "to your registered email address"
            )}
            . <br />
            Please check your inbox and confirm to activate your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4 mt-2">
          <Button
            onClick={handleResend}
            disabled={resending}
            className="w-full"
          >
            {resending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" /> Sending...
              </>
            ) : (
              <>
                <MailWarning className="size-4 mr-2" /> Resend verification
                email
              </>
            )}
          </Button>

          <Link
            href="/login"
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            Back to Login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
