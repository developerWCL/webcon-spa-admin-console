/**
 * Barrel export for all model types
 *
 * Core data entities (business models) that are used throughout the application.
 * These represent the fundamental data structures and entities from your backend.
 *
 * Usage:
 * import { User, Staff, Service, Customer } from '@/types/models'
 */

export type { User, Role, Permission, Session } from "./auth";
export type {
  Staff,
  StaffDayOff,
  StaffWithDayOffs,
  DayOffReason,
} from "./staff";
export type {
  Service,
  ServiceCategory,
  SubService,
  Package,
  Programme,
} from "./service";
export type { Promotion, LoyaltyPoint } from "./promotion";
export type {
  Customer,
  CustomerProfile,
  Address,
  CustomerPreferences,
} from "./customer";
export type {
  Branch,
  BranchOperatingHours,
  BranchSpecialClosure,
  Spa,
} from "./branch";
