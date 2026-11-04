/**
 * Promotion and Discount Models
 *
 * Core entities related to promotions, discounts, and special offers.
 */

export interface ActiveDayWithTime {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  allDay: boolean;
  startTime?: string; // HH:mm format (e.g., "09:00")
  endTime?: string; // HH:mm format (e.g., "18:00")
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number | string;
  minPurchaseAmount?: number | string;
  startDate: string;
  endDate: string;
  // Support both legacy string format and new object format
  activeDays: ActiveDayWithTime[];
  branch: {
    id: string;
    name: string;
    location: string;
    phone: string;
    email?: string | null;
    // ...other branch fields as needed
  };
  status: "active" | "inactive";
  used: number;
  maxUsed: number;
  maxUsedPerAccount?: number;
  guestType?: "all_guests" | "authenticated_only";
  media?: Array<{
    id: string;
    url: string;
    filename: string;
    mimeType: string;
  }>;
  services?: Array<{
    id: string;
    service: {
      id: string;
      name: string;
    };
  }>;
  packages?: Array<{
    id: string;
    package: {
      id: string;
      name: string;
    };
  }>;
  programmes?: Array<{
    id: string;
    programme: {
      id: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface LoyaltyPoint {
  id: string;
  customerId: string;
  points: number;
  reason?: string;
  expiresAt?: string;
  createdAt?: string;
}
