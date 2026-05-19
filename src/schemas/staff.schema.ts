import { z } from "zod";

export const staffFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 8,
      "Password must be at least 8 characters",
    )
    .refine(
      (val) => !val || val.length <= 100,
      "Password must be less than 100 characters",
    ),
  role: z.string().min(1, "Role is required"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s\-+()]+$/.test(val),
      "Please enter a valid phone number",
    ),
  specialties: z.string().optional(),
  workingHours: z.string().optional(),
});

export type StaffFormData = z.infer<typeof staffFormSchema>;
