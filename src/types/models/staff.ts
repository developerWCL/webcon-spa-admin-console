/**
 * Staff Management Models
 *
 * Core entities related to staff management including roles, permissions,
 * and staff-specific data.
 */

import type { User, Role } from "./auth";

export interface Staff extends User {
  createdAt?: string;
  updatedAt?: string;
  branches?: any[];
  roles?: Role[];
  phone?: string;
  specialties?: string;
  workingHours?: string;
  password?: string;
}

export interface StaffDayOff {
  id: string;
  date: string;
  staffId: string;
  staffName?: string;
  reason: string;
  status: "approved" | "pending" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

export enum DayOffReason {
  SICK = "sick",
  VACATION = "vacation",
  PERSONAL = "personal",
  OTHER = "other",
}

/**
 * Extended Staff with day-off information
 * Used when displaying staff details with their scheduled time off
 */
export interface StaffWithDayOffs extends Staff {
  dayOffs?: StaffDayOff[];
  upcomingDayOffs?: StaffDayOff[];
}

// Re-export User for convenience in staff module
export type { User } from "./auth";
