/**
 * Branch and Location Models
 *
 * Core entities related to spa branches and locations.
 */

export interface Branch {
  id: string;
  spaId: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
  isActive: boolean;
  media?: Media[];
  operatingHours?: BranchOperatingHours[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Media {
  id: string;
  url: string;
  type: string; // e.g., 'image', 'video'
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchOperatingHours {
  id: string;
  branchId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
  isClosed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchSpecialClosure {
  id: string;
  branchId: string;
  specificDate: string; // YYYY-MM-DD format
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Spa {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  apiKey?: string;
  isActive: boolean;
  branches?: Branch[];
  createdAt?: string;
  updatedAt?: string;
}
