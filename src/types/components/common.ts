/**
 * Shared Component Props Types
 *
 * Types for commonly shared component props that are used across
 * multiple components or passed between different component modules.
 */

import type { ReactNode } from "react";

/**
 * Pagination component props
 * Used by table, list, and data components that display paginated data
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  maxPagesShown?: number;
  isLoading?: boolean;
}

/**
 * Data table column definition
 * Generic column type for table components
 */
export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  render?: (value: any, row: T) => ReactNode;
  align?: "left" | "center" | "right";
}

/**
 * Data table props
 * Used by table components displaying structured data
 */
export interface DataTableProps<T extends Record<string, any>> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey: keyof T;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  sortBy?: keyof T;
  sortOrder?: "asc" | "desc";
  onSort?: (key: keyof T, order: "asc" | "desc") => void;
}

/**
 * Dialog/Modal props
 * Used for dialog and modal components
 */
export interface DialogProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  showFooter?: boolean;
  isLoading?: boolean;
}

/**
 * Form section container props
 */
export interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Search and filter toolbar props
 */
export interface SearchFilterProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  isLoading?: boolean;
}

/**
 * Alert/Toast notification props
 */
export interface NotificationProps {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state component props
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Loading skeleton props
 */
export interface SkeletonProps {
  count?: number;
  height?: string | number;
  width?: string | number;
  circle?: boolean;
  className?: string;
}
