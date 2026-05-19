/**
 * Service API Request and Response Types
 *
 * Types for all service and offerings-related API endpoints.
 */

import type {
  Service,
  ServiceCategory,
  SubService,
  Package,
  Programme,
} from "../models";
import type { ApiResponse, PaginationMeta } from "./common";

/**
 * Get services request parameters
 */
export interface GetServicesRequest {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

/**
 * Services list response (paginated)
 */
export interface ServicesListResponse extends ApiResponse<Service[]> {
  meta?: PaginationMeta;
}

/**
 * Create service request
 */
export interface CreateServiceRequest {
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
 * Update service request
 */
export interface UpdateServiceRequest extends Partial<
  Omit<CreateServiceRequest, "categoryId">
> {
  id: string;
}

/**
 * Service response
 */
export interface ServiceResponse extends ApiResponse<Service> {}

/**
 * Get service categories request parameters
 */
export interface GetServiceCategoriesRequest {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * Service categories list response (paginated)
 */
export interface ServiceCategoriesListResponse extends ApiResponse<
  ServiceCategory[]
> {
  meta?: PaginationMeta;
}

/**
 * Create service category request
 */
export interface CreateServiceCategoryRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

/**
 * Service category response
 */
export interface ServiceCategoryResponse extends ApiResponse<ServiceCategory> {}

/**
 * Get packages request parameters
 */
export interface GetPackagesRequest {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * Packages list response (paginated)
 */
export interface PackagesListResponse extends ApiResponse<Package[]> {
  meta?: PaginationMeta;
}

/**
 * Create package request
 */
export interface CreatePackageRequest {
  name: string;
  description?: string;
  serviceIds: string[];
  price?: number;
  discount?: number;
  isActive?: boolean;
}

/**
 * Package response
 */
export interface PackageResponse extends ApiResponse<Package> {}

/**
 * Get programmes request parameters
 */
export interface GetProgrammesRequest {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * Programmes list response (paginated)
 */
export interface ProgrammesListResponse extends ApiResponse<Programme[]> {
  meta?: PaginationMeta;
}

/**
 * Create programme request
 */
export interface CreateProgrammeRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Programme response
 */
export interface ProgrammeResponse extends ApiResponse<Programme> {}
