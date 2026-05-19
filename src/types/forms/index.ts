/**
 * Barrel export for all form value types
 *
 * Form-specific value types and Zod schema exports.
 * These define the structure of form data before submission.
 *
 * Note: Zod schemas should be imported from @/schemas/
 * This directory exports the inferred types from those schemas.
 *
 * Usage:
 * import type { StaffLoginFormValues, CreateStaffFormValues } from '@/types/forms'
 * import { StaffLoginSchema } from '@/schemas/auth.schema'
 */

export type {
  StaffLoginFormValues,
  ForgotPasswordFormValues,
  ResetPasswordFormValues,
} from "./auth";

export type {
  CreateStaffFormValues,
  UpdateStaffFormValues,
  CreateDayOffFormValues,
  UpdateDayOffFormValues,
  StaffFilterFormValues,
  DayOffFilterFormValues,
} from "./staff";

export type {
  CreateServiceFormValues,
  UpdateServiceFormValues,
  CreateServiceCategoryFormValues,
  UpdateServiceCategoryFormValues,
  CreateProgrammeFormValues,
  UpdateProgrammeFormValues,
  ServiceFilterFormValues,
} from "./service";

export type {
  CreatePackageFormValues,
  UpdatePackageFormValues,
  PackageTranslationFormValues,
  PackageFilterFormValues,
} from "./package";
