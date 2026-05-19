/**
 * Table Component Props Types
 *
 * Specific props for data table and list components
 */

import type { ReactNode } from "react";
import type { PaginationMeta } from "../api";

/**
 * Table row action button definition
 */
export interface RowAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "destructive" | "secondary";
  requiresConfirmation?: boolean;
  confirmMessage?: string;
}

/**
 * Table cell props
 */
export interface TableCellProps {
  align?: "left" | "center" | "right";
  className?: string;
  width?: string | number;
}

/**
 * Table header props
 */
export interface TableHeaderProps {
  sortable?: boolean;
  sortOrder?: "asc" | "desc" | null;
  onSort?: () => void;
  align?: "left" | "center" | "right";
}

/**
 * Table footer/pagination props
 */
export interface TableFooterProps {
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  rowsPerPageOptions?: number[];
}

/**
 * Bulk actions toolbar props
 */
export interface BulkActionsProps<T> {
  selectedCount: number;
  actions: RowAction<T>[];
  onClearSelection: () => void;
}

/**
 * Staff list table specific props
 */
export interface StaffTableProps {
  data: any[];
  isLoading?: boolean;
  onEdit?: (staffId: string) => void;
  onDelete?: (staffId: string) => void;
  onViewDetails?: (staffId: string) => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

/**
 * Day-off list table specific props
 */
export interface DayOffTableProps {
  data: any[];
  isLoading?: boolean;
  onApprove?: (dayOffId: string) => void;
  onReject?: (dayOffId: string) => void;
  onDelete?: (dayOffId: string) => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

/**
 * Services list table specific props
 */
export interface ServicesTableProps {
  data: any[];
  isLoading?: boolean;
  onEdit?: (serviceId: string) => void;
  onDelete?: (serviceId: string) => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}
