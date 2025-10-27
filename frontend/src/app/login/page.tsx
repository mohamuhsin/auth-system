"use client";

export const dynamic = "force-dynamic"; // ✅ Prevents static pre-render issues

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

/* ============================================================
   🔐 Login Page — Auth by Iventics (Level 2.8)
   ------------------------------------------------------------
   • Client-rendered (Firebase + useSearchParams safe)
   • Prevents build-time static errors
   • Clean, centered layout
============================================================ */
export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* 🛡️ Header Logo */}
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

        {/* 🔑 Login Form */}
        <LoginForm />
      </div>
    </div>
  );
}
