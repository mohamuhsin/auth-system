/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/services/firebase";
import { useAuth } from "@/context/authContext";
import { toast, toastAsync, toastMessage } from "@/lib/toast";
import { loginWithEmailPassword } from "@/lib/auth";

/* ============================================================
   🔑 LoginForm — Email + Google Login
============================================================ */
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithFirebase } = useAuth();
  const searchParams = useSearchParams();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  /* ============================================================
     📢 Handle success after password reset
  ============================================================ */
  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      toast.dismiss();
      toastMessage("Password updated. Please sign in.", { type: "success" });
    }
  }, [searchParams]);

  /* ============================================================
     📩 Email/Password Login
  ============================================================ */
  async function onSubmit(values: LoginFormValues) {
    if (!values.email || !values.password) {
      toast.dismiss();
      toastMessage("Please fill in both fields before logging in.", {
        type: "warning",
      });
      return;
    }

    try {
      toast.dismiss();
      const email = values.email.trim().toLowerCase();
      const result = await loginWithEmailPassword(email, values.password);
      if (result?.ok) form.reset();
    } catch (err: any) {
      toast.dismiss();
      toastMessage(err?.message || "Login failed. Please try again.", {
        type: "error",
      });
    }
  }

  /* ============================================================
     🌐 Google Login
  ============================================================ */
  async function handleGoogleLogin() {
    await toastAsync(
      async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        const userCred = await signInWithPopup(auth, provider);
        const googleUser = userCred.user;
        const result = await loginWithFirebase(googleUser);

        toast.dismiss();

        if (!result || result.status !== "success") {
          if ((result as any)?.statusCode === 404) {
            toastMessage("No account found. Redirecting to signup...", {
              type: "warning",
            });
            setTimeout(() => window.location.replace("/signup"), 1000);
            return;
          }

          if ((result as any)?.code === 403) {
            toastMessage("Please verify your email before logging in.", {
              type: "warning",
            });
            setTimeout(
              () =>
                window.location.replace(
                  `/verify-email?email=${googleUser.email}`
                ),
              1000
            );
            return;
          }

          throw new Error(result?.message || "Session creation failed.");
        }

        toastMessage("Signed in successfully. Redirecting...", {
          type: "success",
        });
        window.location.replace("/dashboard");
      },
      {
        loading: "Connecting to Google...",
        success: "Connected.",
        error: "Google sign-in failed. Please try again.",
      }
    );
  }

  /* ============================================================
     🎨 UI Layout
  ============================================================ */
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-display">Welcome back</CardTitle>
          <CardDescription>
            Login with your email or Google account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {/* 🌐 Google Login */}
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={form.formState.isSubmitting}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="size-5 mr-2"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0
                        14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94
                        c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6
                        c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19
                        C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6
                        c-2.15 1.45-4.92 2.3-8.16 2.3
                        -6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19
                        C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              {/* 📧 Email */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
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

              {/* 🔑 Password */}
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Link
                        href="/forgot-password"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="pr-10"
                        autoComplete="current-password"
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

              {/* 🚀 Submit */}
              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="underline-offset-4 hover:underline"
                  >
                    Sign up
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

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
