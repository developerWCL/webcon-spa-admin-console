/**
 * Barrel export for all component prop types
 *
 * Props definitions for shared components used across the application.
 * Define types here when a component's props might be reused or passed
 * between multiple components.
 *
 * Usage:
 * import type { DataTableProps, PaginationProps } from '@/types/components'
 */

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
} from "./common";

export type {
  RowAction,
  TableCellProps,
  TableHeaderProps,
  TableFooterProps,
  BulkActionsProps,
  StaffTableProps,
  DayOffTableProps,
  ServicesTableProps,
} from "./table";

export type {
  LayoutProps,
  PageHeaderProps,
  SidebarProps,
  CardProps,
  ContentWrapperProps,
  BreadcrumbItem,
  BreadcrumbsProps,
  TabItem,
  TabsProps,
} from "./layout";

export type {
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
} from "./form";
