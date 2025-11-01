/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";
import { resendVerificationEmail } from "@/lib/auth"; // ✅ updated import path
import { toastMessage } from "@/lib/toast";
import { useAuth } from "@/context/authContext";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, MailCheck, MailWarning } from "lucide-react";

/* ============================================================
   ✉️ VerifyEmailNotice — User email verification notice
============================================================ */
export function VerifyEmailNotice() {
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { waitForSession } = useAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  /* ============================================================
     👁️ Watch for Firebase user verification changes
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
      } catch {}

      if (user.emailVerified) {
        toastMessage("Your email has been verified!", { type: "success" });
        await waitForSession?.();
        setTimeout(() => router.replace("/dashboard"), 800);
        return;
      }

      // Poll every 5s for verification change
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
          return;
        }

        if (current.emailVerified) {
          clearPoll();
          toastMessage("Email verified! Redirecting...", { type: "success" });
          await waitForSession?.();
          router.replace("/dashboard");
        }
      }, 5000);

      setChecking(false);
    });

    return () => {
      clearPoll();
      unsubscribe();
    };
  }, [router, waitForSession]);

  /* ============================================================
     📩 Resend verification link
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
      await resendVerificationEmail(); // ✅ handles its own toasts internally
    } catch {
      toastMessage("Failed to resend verification email.", { type: "error" });
    } finally {
      setResending(false);
    }
  };

  /* ============================================================
     🌀 Loading state
  ============================================================ */
  if (checking) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  /* ============================================================
     🎨 UI Layout
  ============================================================ */
  return (
    <div className="flex flex-col gap-6">
      <Card>
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
                to <span className="font-medium text-primary">{userEmail}</span>
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

      <p className="px-6 text-center text-sm text-muted-foreground">
        Didn’t receive the email?{" "}
        <span className="font-medium text-primary">
          Check your spam folder.
        </span>
      </p>
    </div>
  );
}
