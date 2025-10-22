import { ShieldCheck } from "lucide-react";
import { SignupForm } from "@/components/auth/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
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

        {/* 🔑 Login Form */}
        <SignupForm />
      </div>
    </div>
  );
}

/* ============================================================
   🌐 GLOBAL THEME — Auth by Iventics
   ------------------------------------------------------------
   • Refined "Iventics Royal Indigo" palette (#375DFB)
   • Optimized for Neutral base in both modes
   • Tuned shadows, borders, and accent contrasts
============================================================ */
