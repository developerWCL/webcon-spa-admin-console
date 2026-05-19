"use server";

import {
  StaffLoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/schemas/auth.schema";
import type { LoginResponse } from "@/types/api";
import { signOut } from "@/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function loginAction(values: {
  email: string;
  password: string;
}): Promise<{ success?: boolean; error?: string; data?: LoginResponse }> {
  const validatedFields = StaffLoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email or password format" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/staff-auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for HTTP-only cookie handling
      body: JSON.stringify(validatedFields.data),
      cache: "no-cache",
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || "Invalid credentials" };
    }

    const data: LoginResponse = await response.json();

    // Token is stored in HTTP-only cookie by backend
    // Only staff data is stored in localStorage for reference
    return { success: true, data };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Login failed. Please try again." };
  }
}

export async function forgotPasswordAction(values: {
  email: string;
}): Promise<{ success?: boolean; error?: string; message?: string }> {
  const validatedFields = ForgotPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email format" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/staff-auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validatedFields.data),
      cache: "no-cache",
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || "Failed to send reset email" };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { error: "Failed to send reset email. Please try again." };
  }
}

export async function resetPasswordAction(values: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<{ success?: boolean; error?: string; message?: string }> {
  const validatedFields = ResetPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid password format" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/staff-auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: values.token,
        newPassword: validatedFields.data.password,
      }),
      cache: "no-cache",
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || "Password reset failed" };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "Password reset failed. Please try again." };
  }
}

export async function logoutAction(accessToken: string): Promise<void> {
  // Call backend logout endpoint
  try {
    const response = await fetch(`${API_BASE_URL}/staff-auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-cache",
    });

    if (!response.ok) {
      console.error("Backend logout failed");
    }
  } catch (error) {
    console.error("Backend logout error:", error);
  }

  // Clear NextAuth session and redirect
  // This will throw a redirect error that should be allowed to propagate
  await signOut({ redirectTo: "/login" });
}
