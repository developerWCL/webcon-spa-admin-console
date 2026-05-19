/**
 * Package Management Form Types
 *
 * Types for package creation and updates with sub-service management.
 */

import { z } from "zod";
import type {
  CreatePackageSchema,
  UpdatePackageSchema,
  PackageTranslationSchema,
} from "@/schemas/package.schema";

/**
 * Create package form values (inferred from Zod schema)
 */
export type CreatePackageFormValues = z.infer<typeof CreatePackageSchema>;

/**
 * Update package form values (inferred from Zod schema)
 */
export type UpdatePackageFormValues = z.infer<typeof UpdatePackageSchema>;

/**
 * Package translation form values
 */
export type PackageTranslationFormValues = z.infer<
  typeof PackageTranslationSchema
>;

/**
 * Package filter form values for list filtering
 */
export interface PackageFilterFormValues {
  search?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
}
