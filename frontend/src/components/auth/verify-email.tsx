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
  const searchParams = useSearchParams();
  const router = useRouter();

  // 🧭 Get email from query param (passed after signup)
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setUserEmail(emailParam);

    // Also check if there's a logged-in user
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email && !emailParam) {
        setUserEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, [searchParams]);

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
    );

    setResending(false);
  };

  /* ============================================================
     🧩 UI
  ============================================================ */
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
