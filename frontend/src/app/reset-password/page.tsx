"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/resetPassword-form";

export default function ResetPasswordPageClient() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <ShieldCheck className="size-4" />
          </div>
          <span className="text-foreground font-semibold tracking-tight">
            Auth by Iventics
          </span>
        </Link>

        <Suspense
          fallback={
            <div className="flex h-40 items-center justify-center text-center text-muted-foreground">
              Loading reset form...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
