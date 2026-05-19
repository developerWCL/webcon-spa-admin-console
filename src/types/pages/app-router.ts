/**
 * Next.js App Router Page Types
 *
 * Standardized types for page components using Next.js 13+ App Router.
 * These types help maintain consistency across page layouts and route segments.
 *
 * Reference: https://nextjs.org/docs/app/building-your-application/routing
 */

import type { ReactNode } from "react";

/**
 * Dynamic route segment parameters
 *
 * Use this for extracting route parameters from dynamic segments.
 * For example, in /app/[branchId]/dashboard/page.tsx:
 *
 * @example
 * interface DashboardPageParams extends PageParams {
 *   branchId: string;
 * }
 *
 * export default function DashboardPage({ params }: { params: DashboardPageParams }) {
 *   // params.branchId is available here
 * }
 */
export interface PageParams {
  [key: string]: string | string[];
}

/**
 * Route segment parameters (e.g., /dashboard/[branchId])
 * Extends PageParams for type safety
 */
export interface BranchPageParams extends PageParams {
  branchId: string;
}

/**
 * Nested route parameters (e.g., /dashboard/[branchId]/staff/[staffId])
 */
export interface BranchStaffPageParams extends BranchPageParams {
  staffId: string;
}

/**
 * Search parameters (query string)
 *
 * Use this for typed access to search parameters.
 * Next.js 13+ provides searchParams via props.
 *
 * @example
 * interface DashboardSearchParams {
 *   page?: string;
 *   limit?: string;
 *   search?: string;
 * }
 *
 * export default function DashboardPage({
 *   searchParams,
 * }: {
 *   searchParams: DashboardSearchParams;
 * }) {
 *   const page = parseInt(searchParams.page || '1');
 * }
 */
export interface PageSearchParams {
  [key: string]: string | string[] | undefined;
}

/**
 * Common search parameters for list/table pages
 */
export interface ListPageSearchParams extends PageSearchParams {
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

/**
 * Dashboard search parameters with filters
 */
export interface DashboardSearchParams extends ListPageSearchParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  category?: string;
}

/**
 * Standard page component props for App Router
 */
export interface PageProps<
  P extends PageParams = PageParams,
  S extends PageSearchParams = PageSearchParams,
> {
  params: P;
  searchParams: S;
}

/**
 * Layout component props for App Router
 * Use this for root layout components in your app structure
 */
export interface PageLayoutProps {
  children: ReactNode;
  params?: PageParams;
}

/**
 * Nested route segment layout props
 */
export interface BranchLayoutProps extends PageLayoutProps {
  params: BranchPageParams;
}

/**
 * Page props for dashboard pages
 */
export interface DashboardPageProps extends PageProps<
  BranchPageParams,
  DashboardSearchParams
> {}

/**
 * Page props for detail pages with ID
 */
export interface DetailPageProps extends PageProps<BranchStaffPageParams> {}

/**
 * Helper function to parse pagination from search params
 */
export function getPaginationFromSearchParams(searchParams: PageSearchParams): {
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(searchParams.page?.[0] || "1") || 1);
  const limit = Math.max(
    1,
    Math.min(100, parseInt(searchParams.limit?.[0] || "10") || 10),
  );
  return { page, limit };
}

/**
 * Helper function to build query string from params
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );

  return filtered.length > 0 ? `?${filtered.join("&")}` : "";
}
