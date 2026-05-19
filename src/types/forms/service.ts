/**
 * Service Management Form Types
 *
 * Types for service, category, package, and programme forms.
 */

/**
 * Create service form values
 */
export interface CreateServiceFormValues {
  name: string;
  description?: string;
  categoryId: string;
  durationMinutes?: number;
  price?: number;
  isActive?: boolean;
  displayOrder?: number;
  imageUrl?: string;
}

/**
 * Update service form values
 */
export interface UpdateServiceFormValues extends Omit<
  CreateServiceFormValues,
  "categoryId"
> {
  id: string;
}

/**
 * Create service category form values
 */
export interface CreateServiceCategoryFormValues {
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

/**
 * Update service category form values
 */
export interface UpdateServiceCategoryFormValues extends Partial<CreateServiceCategoryFormValues> {
  id: string;
}

/**
 * Create package form values
 */
export interface CreatePackageFormValues {
  name: string;
  description?: string;
  serviceIds: string[];
  price?: number;
  discount?: number;
  isActive?: boolean;
}

/**
 * Update package form values
 */
export interface UpdatePackageFormValues extends Partial<CreatePackageFormValues> {
  id: string;
}

/**
 * Create programme form values
 */
export interface CreateProgrammeFormValues {
  name: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Update programme form values
 */
export interface UpdateProgrammeFormValues extends Partial<CreateProgrammeFormValues> {
  id: string;
}

/**
 * Service filter form values
 */
export interface ServiceFilterFormValues {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Package filter form values
 */
export interface PackageFilterFormValues {
  search?: string;
  isActive?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
}
