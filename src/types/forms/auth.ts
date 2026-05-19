/**
 * Re-export Zod schemas and form value types from schemas directory
 *
 * This file serves as a bridge between the forms directory and the schemas directory.
 * Form-related schemas are defined in /src/schemas and imported here for
 * centralized access from the /types/forms directory.
 *
 * Note: Zod schemas should remain in /src/schemas/ for easier validation logic reuse.
 * This file re-exports them for convenience in the types hierarchy.
 */

export type {
  StaffLoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/schemas/auth.schema";

// Import schema types for additional form value types
import { z } from "zod";
import type {
  StaffLoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/schemas/auth.schema";

/**
 * Type aliases for form values
 * These map to the inferred types from Zod schemas
 */
export type StaffLoginFormValues = StaffLoginSchema;
export type ForgotPasswordFormValues = ForgotPasswordSchema;
export type ResetPasswordFormValues = ResetPasswordSchema;
