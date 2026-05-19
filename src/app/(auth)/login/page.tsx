"use client";

import LoginForm from "./_components/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-8">
            <Image
              src="/orientala/orientala-spa-white-logo.png"
              alt="Orientala Spa Logo"
              width={326}
              height={200}
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome Orientala Spa
            </h1>
            <p className="text-muted-foreground text-balance">
              Enter your email to sign in to your account
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2026 Orientala Spa. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
