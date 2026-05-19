/**
 * Barrel export for all page-related types
 *
 * Types for Next.js App Router pages, layouts, and route parameters.
 * These ensure consistent page component interfaces across the application.
 *
 * Usage:
 * import type { DashboardPageProps, PageParams } from '@/types/pages'
 * import { getPaginationFromSearchParams } from '@/types/pages'
 */

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
} from "./app-router";

export { getPaginationFromSearchParams, buildQueryString } from "./app-router";

export type {
  LoginPageSearchParams,
  LoginPageProps,
  ForgotPasswordPageSearchParams,
  ResetPasswordPageSearchParams,
  AuthLayoutParams,
} from "./auth";

export type {
  DashboardLayoutProps,
  StaffPageSearchParams,
  DayOffPageSearchParams,
  ServicesPageSearchParams,
  ProgrammesPageSearchParams,
  SettingsPageSearchParams,
  StaffDetailPageSearchParams,
} from "./dashboard";
