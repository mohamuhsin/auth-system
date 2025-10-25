import { VerifyEmailNotice } from "@/components/auth/verify-email";

export const metadata = {
  title: "Verify Email | Auth by Iventics",
  description: "Please verify your email to activate your account",
};

export default function VerifyEmailPage() {
  return <VerifyEmailNotice />;
}
