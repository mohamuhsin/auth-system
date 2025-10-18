import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
