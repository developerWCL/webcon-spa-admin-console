/**
 * Layout and Container Component Props Types
 *
 * Props for layout wrappers, containers, and section components
 */

import type { ReactNode } from "react";

/**
 * Main layout props
 */
export interface LayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page header props
 */
export interface PageHeaderProps {
  title: string;
  description?: string;
  backButton?: {
    label: string;
    href: string;
  };
  actions?: ReactNode;
  className?: string;
}

/**
 * Sidebar props
 */
export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  children: ReactNode;
  width?: string | number;
  className?: string;
}

/**
 * Card container props
 */
export interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Content wrapper props
 */
export interface ContentWrapperProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

/**
 * Breadcrumbs component props
 */
export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

/**
 * Tabs item definition
 */
export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

/**
 * Tabs component props
 */
export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
  className?: string;
}
