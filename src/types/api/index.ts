/**
 * Barrel export for all API request/response types
 *
 * Request bodies, response shapes, and API contract types.
 * These define the contract between frontend and backend.
 *
 * Usage:
 * import type { LoginRequest, LoginResponse, ApiResponse } from '@/types/api'
 * import type { StaffDayOff, PaginationMeta } from '@/types/api'
 */

export type {
  ApiResponse,
  PaginationMeta,
  ApiMeta,
  ApiError,
  PaginatedResponse,
} from "./common";
export { isApiError, hasPagination } from "./common";

export type { CreateBranchRequest, UpdateBranchRequest } from "./branch";

export type {
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  LogoutResponse,
  CurrentUserResponse,
} from "./auth";

export type {
  StaffDayOff,
  GetStaffRequest,
  StaffListResponse,
  CreateStaffRequest,
  UpdateStaffRequest,
  StaffResponse,
  GetStaffDayOffsRequest,
  StaffDayOffsListResponse,
  CreateStaffDayOffRequest,
  UpdateStaffDayOffRequest,
  StaffDayOffResponse,
} from "./staff";

export type {
  GetServicesRequest,
  ServicesListResponse,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceResponse,
  GetServiceCategoriesRequest,
  ServiceCategoriesListResponse,
  CreateServiceCategoryRequest,
  ServiceCategoryResponse,
  GetPackagesRequest,
  PackagesListResponse,
  CreatePackageRequest,
  PackageResponse,
  GetProgrammesRequest,
  ProgrammesListResponse,
  CreateProgrammeRequest,
  ProgrammeResponse,
} from "./service";

export type { GetBookingsResponse } from "./booking";

export type { Language } from "./language";
