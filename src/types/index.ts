/**
 * Central Type Exports
 *
 * This file serves as the main entry point for all types in the application.
 * It re-exports types from all subdirectories for convenient access.
 *
 * Directory Structure:
 * - /models: Core business entity types
 * - /api: Request/response types for API contracts
 * - /components: Shared component prop types
 * - /forms: Form value types and schemas
 * - /pages: Next.js page and route parameter types
 *
 * Usage:
 * import type { User, Staff } from '@/types/models'
 * import type { LoginRequest, ApiResponse } from '@/types/api'
 * import type { DataTableProps } from '@/types/components'
 * import type { StaffLoginFormValues } from '@/types/forms'
 * import type { DashboardPageProps } from '@/types/pages'
 *
 * Or import everything from the root:
 * import type * as Types from '@/types'
 */

// Re-export all models
export type * from "./models";

// Re-export API types (excluding StaffDayOff which already comes from models)
export type {
  ApiResponse,
  PaginationMeta,
  ApiMeta,
  ApiError,
  PaginatedResponse,
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
} from "./api";

// Re-export component types (excluding LayoutProps which might conflict)
export type {
  PaginationProps,
  ColumnDef,
  DataTableProps,
  DialogProps,
  FormSectionProps,
  SearchFilterProps,
  NotificationProps,
  EmptyStateProps,
  SkeletonProps,
  RowAction,
  TableCellProps,
  TableHeaderProps,
  TableFooterProps,
  BulkActionsProps,
  StaffTableProps,
  DayOffTableProps,
  ServicesTableProps,
  PageHeaderProps,
  SidebarProps,
  CardProps,
  ContentWrapperProps,
  BreadcrumbItem,
  BreadcrumbsProps,
  TabItem,
  TabsProps,
  FormFieldProps,
  TextInputProps,
  TextareaProps,
  SelectOption,
  SelectProps,
  CheckboxProps,
  RadioProps,
  DatePickerProps,
  DateRangePickerProps,
  TimePickerProps,
  FileInputProps,
  FormButtonProps,
} from "./components";

// Re-export form types
export type * from "./forms";

// Re-export page types (excluding LayoutProps from components)
export type {
  PageParams,
  BranchPageParams,
  BranchStaffPageParams,
  PageSearchParams,
  ListPageSearchParams,
  DashboardSearchParams,
  PageProps,
  PageLayoutProps,
  BranchLayoutProps,
  DetailPageProps,
  LoginPageSearchParams,
  LoginPageProps,
  ForgotPasswordPageSearchParams,
  ResetPasswordPageSearchParams,
  AuthLayoutParams,
  DashboardLayoutProps,
  StaffPageSearchParams,
  DayOffPageSearchParams,
  ServicesPageSearchParams,
  ProgrammesPageSearchParams,
  SettingsPageSearchParams,
  StaffDetailPageSearchParams,
} from "./pages";

// Export utility functions
export { isApiError, hasPagination } from "./api";
export { getPaginationFromSearchParams, buildQueryString } from "./pages";
