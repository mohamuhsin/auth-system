import { ShieldCheck } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgotPassword-form";

export default function ForgotPasswordPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* 🔰 Brand Header */}
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <ShieldCheck className="size-4" />
          </div>
          <span className="text-foreground font-semibold tracking-tight">
            Auth by Iventics
          </span>
        </a>

        {/* ✉️ Forgot Password Form */}
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
