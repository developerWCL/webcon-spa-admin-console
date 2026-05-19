/**
 * Staff Management API Request and Response Types
 *
 * Types for all staff-related API endpoints.
 */

import type { Staff, StaffDayOff as StaffDayOffModel } from "../models";
import type { ApiResponse, PaginationMeta } from "./common";

/**
 * StaffDayOff type - re-export from models for backward compatibility
 * @deprecated Import from @/types/models instead
 */
export type StaffDayOff = StaffDayOffModel;

/**
 * Get staff request parameters
 */
export interface GetStaffRequest {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  spaId?: string;
  status?: "active" | "inactive" | "all";
}

/**
 * Staff list response (paginated)
 */
export interface StaffListResponse extends ApiResponse<Staff[]> {
  meta?: PaginationMeta;
}

/**
 * Create staff request
 */
export interface CreateStaffRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  branchIds: string[];
  roleIds?: string[];
  specialties?: string;
  workingHours?: string;
  isActive?: boolean;
}

/**
 * Update staff request
 */
export interface UpdateStaffRequest extends Partial<
  Omit<CreateStaffRequest, "email">
> {
  id: string;
}

/**
 * Staff response
 */
export interface StaffResponse extends ApiResponse<Staff> {}

/**
 * Get staff day-offs request parameters
 */
export interface GetStaffDayOffsRequest {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  spaId?: string;
  status?: "approved" | "pending" | "all";
  startDate?: string;
  endDate?: string;
}

/**
 * Staff day-offs list response (paginated)
 */
export interface StaffDayOffsListResponse extends ApiResponse<
  StaffDayOffModel[]
> {
  meta?: PaginationMeta;
}

/**
 * Create staff day-off request
 */
export interface CreateStaffDayOffRequest {
  staffId: string;
  date: string;
  reason: string;
}

/**
 * Update staff day-off request
 */
export interface UpdateStaffDayOffRequest extends Partial<CreateStaffDayOffRequest> {
  id: string;
  status?: "approved" | "pending" | "rejected";
}

/**
 * Staff day-off response
 */
export interface StaffDayOffResponse extends ApiResponse<StaffDayOff> {}
