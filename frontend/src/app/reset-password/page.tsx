import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/resetPassword-form";

/* ============================================================
   🔐 Reset Password Page (Client-safe with Suspense)
============================================================ */
export default function ResetPasswordPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* 🔰 Brand Header */}
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

        {/* 🔒 Reset Password Form (Client Component) */}
        <Suspense
          fallback={
            <div className="text-center text-muted-foreground">
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
