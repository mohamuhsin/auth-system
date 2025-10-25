/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

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
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validators/auth";

import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/services/firebase";
import { toastAsync, toastMessage } from "@/lib/toast";

/* ============================================================
   🔑 ResetPasswordForm — Secure Firebase Password Reset
============================================================ */
export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });

  /* ============================================================
     🔍 Extract oobCode (Firebase reset token) from URL
  ============================================================ */
  useEffect(() => {
    const code = searchParams.get("oobCode");
    if (code) setOobCode(code);
  }, [searchParams]);

  /* ============================================================
     🔐 Handle Password Reset
  ============================================================ */
  async function onSubmit(values: ResetPasswordValues) {
    // Basic frontend validation
    if (!oobCode) {
      toastMessage("Invalid or expired password reset link.", {
        type: "error",
      });
      return;
    }

    if (values.password !== values.confirmPassword) {
      toastMessage("Passwords do not match. Please try again.", {
        type: "warning",
      });
      return;
    }

    await toastAsync(
      async () => {
        try {
          await confirmPasswordReset(auth, oobCode, values.password);
          toastMessage("Your password has been updated successfully!", {
            type: "success",
          });

          // Redirect after short delay
          setTimeout(() => router.replace("/login"), 1000);
        } catch (err: any) {
          const code = err.code || "";

          switch (code) {
            case "auth/expired-action-code":
              throw new Error(
                "This password reset link has expired. Please request a new one."
              );
            case "auth/invalid-action-code":
              throw new Error("Invalid or broken password reset link.");
            case "auth/weak-password":
              throw new Error(
                "Your password is too weak. Use at least 8 characters with a number and uppercase letter."
              );
            case "auth/network-request-failed":
              throw new Error(
                "Network error. Please check your connection and try again."
              );
            default:
              throw new Error("Failed to reset password. Please try again.");
          }
        }
      },
      {
        loading: "Updating password...",
        success: "Password updated successfully!",
        error: "Password reset failed. Please try again.",
      }
    );
  }

  /* ============================================================
     💅 UI Render
  ============================================================ */
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-display">Reset Password</CardTitle>
          <CardDescription>
            Choose a strong new password for your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {/* 🔑 New Password */}
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <FormError>{fieldState.error?.message}</FormError>
                  </Field>
                )}
              />

              {/* 🔁 Confirm Password */}
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="confirm-password"
                        type={showConfirm ? "text" : "password"}
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showConfirm ? "Hide password" : "Show password"
                        }
                      >
                        {showConfirm ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <FormError>{fieldState.error?.message}</FormError>
                  </Field>
                )}
              />

              {/* Submit */}
              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Updating..."
                    : "Update Password"}
                </Button>

                <FieldDescription className="text-center">
                  Back to{" "}
                  <Link
                    href="/login"
                    className="underline-offset-4 hover:underline"
                  >
                    Login
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Footer Help */}
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
