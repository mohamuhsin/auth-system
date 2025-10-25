/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MailCheck, MailWarning, Loader2 } from "lucide-react";
import { toastAsync, toastMessage } from "@/lib/toast";
import { auth } from "@/services/firebase";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";

/* ============================================================
   ✉️ VerifyEmailNotice — After Signup (Email Link Sent)
============================================================ */
export function VerifyEmailNotice() {
  const [resending, setResending] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ============================================================
     🧭 Initialize user & email state
  ============================================================ */
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setUserEmail(emailParam);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setChecking(false);
        return;
      }

      // Pull email if not from query
      if (!emailParam && user.email) setUserEmail(user.email);

      // 🔁 Refresh user to get latest verification status
      await user.reload();

      if (user.emailVerified) {
        toastMessage("Your email has been verified!", { type: "success" });
        router.replace("/login");
        return;
      }

      setChecking(false);
    });

    return () => unsubscribe();
  }, [router, searchParams]);

  /* ============================================================
     🔁 Resend Verification Email
  ============================================================ */
  const handleResend = async () => {
    const user = auth.currentUser;

    if (!user) {
      toastMessage("Please log in again before resending verification.", {
        type: "error",
      });
      router.push("/login");
      return;
    }

    await toastAsync(
      async () => {
        setResending(true);
        await sendEmailVerification(user);
      },
      {
        loading: "Sending verification email...",
        success: "Verification link sent successfully!",
        error: "Failed to resend verification email. Try again.",
      }
    ).catch((err: any) => {
      if (err?.code === "auth/too-many-requests") {
        toastMessage(
          "You’ve requested too many verification emails. Please wait a few minutes.",
          { type: "warning" }
        );
      } else {
        toastMessage("Something went wrong. Please try again.", {
          type: "error",
        });
      }
    });

    setResending(false);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 px-6">
      <Card className="w-full max-w-sm border border-border/60 shadow-md bg-background/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <MailCheck className="size-10 text-primary" />
          </div>

          <CardTitle className="text-xl font-display">
            Verify your email
          </CardTitle>

          <CardDescription>
            We’ve sent a verification link
            {userEmail ? (
              <>
                {" "}
                to <strong>{userEmail}</strong>.
              </>
            ) : (
              " to your registered email address."
            )}
            <br />
            Please check your inbox before logging in.
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
    </div>
  );
}
