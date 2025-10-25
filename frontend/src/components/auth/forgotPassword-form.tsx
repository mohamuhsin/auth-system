/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

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

import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/services/firebase";
import { toastAsync, toastMessage } from "@/lib/toast";

/* ============================================================
   🔑 ForgotPasswordForm — Secure Password Reset via Firebase
============================================================ */
export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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
        try {
          await sendPasswordResetEmail(auth, values.email);
        } catch (err: any) {
          const code = err.code || "";

          if (code === "auth/user-not-found") {
            throw new Error(
              "No account found with that email. Please sign up first."
            );
          }

          if (code === "auth/invalid-email") {
            throw new Error("Please enter a valid email address.");
          }

          if (code === "auth/network-request-failed") {
            throw new Error(
              "Network error. Please check your internet connection."
            );
          }

          // Default fallback
          throw new Error("Something went wrong. Please try again later.");
        }
      },
      {
        loading: "Sending reset link...",
        success:
          "Password reset email sent! Check your inbox (and spam folder).",
        error: "Failed to send reset link. Please try again.",
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
            Enter your email address, and we’ll send you a reset link.
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
