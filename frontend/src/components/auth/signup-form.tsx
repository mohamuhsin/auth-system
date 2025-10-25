"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
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
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import { signupSchema, type SignupFormValues } from "@/lib/validators/auth";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/services/firebase";
import { useAuth } from "@/context/authContext";
import { toastAsync, toastMessage } from "@/lib/toast";
import { signupWithEmailPassword } from "@/lib/auth-email";

/* ============================================================
   🟢 SignupForm — Email & Google Signup (Backend Verified)
============================================================ */
export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const { signupWithFirebase } = useAuth();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  /* ============================================================
     ✉️ Email + Password Signup
  ============================================================ */
  async function onSubmit(values: SignupFormValues) {
    if (values.password !== values.confirmPassword) {
      toastMessage("Passwords do not match. Please try again.", {
        type: "error",
      });
      return;
    }

    const result = await signupWithEmailPassword(
      values.email,
      values.password,
      values.name
    );

    if (result?.ok) {
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    }
  }

  /* ============================================================
     🔵 Google Signup — secure backend-verified flow
  ============================================================ */
  async function handleGoogleSignup() {
    await toastAsync(
      async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        const userCred = await signInWithPopup(auth, provider);
        const googleUser = userCred.user;

        const result = await signupWithFirebase(googleUser, {
          name: googleUser.displayName ?? undefined,
          avatarUrl: googleUser.photoURL ?? undefined,
        });

        if (result.status !== "success") {
          if (result.statusCode === 409) {
            toastMessage("Account already exists. Redirecting to login...", {
              type: "warning",
            });
            setTimeout(() => router.push("/login"), 1200);
            return;
          }
          throw new Error(result.message || "Signup verification failed");
        }

        toastMessage("Signed up successfully with Google!", {
          type: "success",
        });
        router.push("/dashboard");
      },
      {
        loading: "Connecting to Google...",
        success: "Connected!",
        error: "Google sign-up failed. Please try again.",
      }
    );
  }

  /* ============================================================
     🧩 UI Layout
  ============================================================ */
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-display">
            Create your account
          </CardTitle>
          <CardDescription>
            Sign up with Google or continue with email
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {/* 🟢 Google Signup */}
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogleSignup}
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
                  Sign up with Google
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              {/* 👤 Full Name */}
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      placeholder="John Doe"
                      autoComplete="name"
                    />
                    <FormError>{fieldState.error?.message}</FormError>
                  </Field>
                )}
              />

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
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

              <FieldDescription>
                Must be at least 8 characters long and include a number and an
                uppercase letter.
              </FieldDescription>

              {/* Submit */}
              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Creating..."
                    : "Create Account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="underline-offset-4 hover:underline"
                  >
                    Sign in
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
