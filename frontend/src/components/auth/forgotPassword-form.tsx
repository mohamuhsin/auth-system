"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      // TODO: Firebase sendPasswordResetEmail(values.email)
      toast.success("Reset link sent (demo)");
      console.log(values);
    } catch (error) {
      toast.error("Failed to send reset link");
      console.error(error);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-display">
            Forgot Password?
          </CardTitle>
          <CardDescription>
            Enter your email address and we’ll send you a reset link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {/* 📧 Email input */}
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

              {/* 📨 Submit */}
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
    </div>
  );
}
