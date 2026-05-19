import { Metadata } from "next";
import ForgotPasswordForm from "./_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password | Orientala Spa",
  description: "Reset your Orientala Spa staff account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md px-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
