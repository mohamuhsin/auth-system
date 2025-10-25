"use client";

/* ============================================================
   🔑 ForgotPasswordForm — Secure Password Reset via Firebase
   ------------------------------------------------------------
   Unified with toastAsync + shared requestPasswordReset helper
============================================================ */

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validators/auth";

import { toastAsync, toastMessage } from "@/lib/toast";
import { requestPasswordReset } from "@/lib/auth-email";

/* ============================================================
   🔐 ForgotPasswordForm — Request reset link via Firebase
============================================================ */
export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  /* ============================================================
     ✉️ Handle Password Reset
  ============================================================ */
  async function onSubmit(values: ForgotPasswordValues) {
    if (!values.email) {
      toastMessage("Please enter your email address first.", {
        type: "warning",
      });
      return;
    }

    await toastAsync(
      async () => {
        const result = await requestPasswordReset(values.email);

        if (!result?.ok) {
          throw new Error("Failed to send password reset link.");
        }

        // Optional small delay before redirect
        setTimeout(() => router.push("/login"), 2500);
      },
      {
        loading: "Sending reset link...",
        success:
          "Password reset email sent! Check your inbox (and spam folder).",
        error: "Unable to send reset link. Please try again later.",
      }
    );
  }

  /* ============================================================
     💅 Render
  ============================================================ */
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-display">
            Forgot Password?
          </CardTitle>
          <CardDescription>
            Enter your email, and we’ll send you a secure reset link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {/* 📧 Email */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email address</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      autoComplete="email"
                    />
                    <FormError>{fieldState.error?.message}</FormError>
                  </Field>
                )}
              />

              {/* 🔘 Submit */}
              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Sending..."
                    : "Send Reset Link"}
                </Button>

                <FieldDescription className="text-center">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="underline-offset-4 hover:underline"
                  >
                    Back to Login
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* 🧭 Footer Help */}
      <FieldDescription className="px-6 text-center">
        Need help?{" "}
        <a
          href="mailto:support@iventics.com"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Contact Support
        </a>
      </FieldDescription>
    </div>
  );
}
