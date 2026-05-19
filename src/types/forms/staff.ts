/**
 * Staff Management Form Types
 *
 * Types for staff creation and management forms.
 */

import { z } from "zod";

/**
 * Create staff form values
 */
export interface CreateStaffFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  branchIds: string[];
  roles?: string[];
  isActive?: boolean;
}

/**
 * Update staff form values
 */
export interface UpdateStaffFormValues extends Omit<
  CreateStaffFormValues,
  "email"
> {
  id: string;
}

/**
 * Create day-off form values
 */
export interface CreateDayOffFormValues {
  staffId: string;
  date: string;
  reason: string;
}

/**
 * Update day-off form values
 */
export interface UpdateDayOffFormValues extends Partial<CreateDayOffFormValues> {
  id: string;
  status?: "approved" | "pending" | "rejected";
}

/**
 * Staff filter form values
 */
export interface StaffFilterFormValues {
  search?: string;
  status?: "active" | "inactive" | "all";
  branchId?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Day-off filter form values
 */
export interface DayOffFilterFormValues {
  search?: string;
  status?: "approved" | "pending" | "all";
  startDate?: string;
  endDate?: string;
  branchId?: string;
  staffId?: string;
}
