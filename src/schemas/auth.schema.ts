import { z } from "zod";

export const StaffLoginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Invalid email format")
    .min(1, "Email is required"),
  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

export type StaffLoginSchema = z.infer<typeof StaffLoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Invalid email format")
    .min(1, "Email is required"),
});

export type ForgotPasswordSchema = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    password: z
      .string({ error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string({ error: "Confirm password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordSchema = z.infer<typeof ResetPasswordSchema>;
