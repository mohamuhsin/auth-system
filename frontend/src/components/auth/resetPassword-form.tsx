"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ Hook Form + Zod setup
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });

  // ✅ Submit handler
  async function onSubmit(values: ResetPasswordValues) {
    try {
      // TODO: Firebase confirmPasswordReset(oobCode, values.password)
      toast.success("Password updated (demo)");
      console.log(values);
    } catch (error) {
      toast.error("Failed to update password");
      console.error(error);
    }
  }

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
                        onClick={() => setShowPassword((prev) => !prev)}
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
                        onClick={() => setShowConfirm((prev) => !prev)}
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

              {/* ✅ Submit */}
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
    </div>
  );
}
