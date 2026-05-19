/**
 * Dashboard Page Types
 *
 * Types for dashboard and main application pages.
 */

import type {
  PageProps,
  BranchPageParams,
  BranchLayoutProps,
  DashboardSearchParams,
} from "./app-router";

/**
 * Main dashboard page props
 */
export interface DashboardPageProps extends PageProps<
  BranchPageParams,
  DashboardSearchParams
> {}

/**
 * Dashboard layout props
 */
export interface DashboardLayoutProps extends BranchLayoutProps {}

/**
 * Staff management page search params
 */
export interface StaffPageSearchParams extends DashboardSearchParams {
  status?: "active" | "inactive" | "all";
  role?: string;
  department?: string;
}

/**
 * Day-off management page search params
 */
export interface DayOffPageSearchParams extends DashboardSearchParams {
  status?: "approved" | "pending" | "rejected" | "all";
  staffId?: string;
}

/**
 * Services management page search params
 */
export interface ServicesPageSearchParams extends DashboardSearchParams {
  categoryId?: string;
  isActive?: "true" | "false" | "all";
}

/**
 * Programmes management page search params
 */
export interface ProgrammesPageSearchParams extends DashboardSearchParams {
  isActive?: "true" | "false" | "all";
}

/**
 * Settings page search params
 */
export interface SettingsPageSearchParams extends DashboardSearchParams {
  tab?: "general" | "team" | "billing" | "security";
}

/**
 * Staff detail page params (when viewing individual staff)
 */
export interface StaffDetailPageSearchParams extends DashboardSearchParams {
  tab?: "overview" | "schedule" | "dayoffs" | "history";
}
