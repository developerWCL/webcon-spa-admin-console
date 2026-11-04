"use server";

import { auth } from "@/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ReportSummaryResponse {
  totalRevenue: number;
  totalBookings: number;
  uniqueCustomers: number;
  avgBookingValue: number;
  revenueGrowth: number;
  bookingsGrowth: number;
  customersGrowth: number;
  avgValueGrowth: number;
}

export interface BookingReportItem {
  bookingId: string;
  customer: string;
  serviceType: string;
  serviceName: string;
  duration: number;
  serviceDate: string;
  serviceTime: string;
  price: number;
  bookingStatus: string;
  paymentStatus: string;
  bookingDate: string;
  promotionCode?: string;
}

export interface TopServiceItem {
  serviceId: string;
  serviceName: string;
  serviceType: "Service" | "Package" | "Programme";
  bookings: number;
  revenue: number;
  growth: number;
}

export interface CustomerSegmentItem {
  segment: "Authenticated" | "Unauthenticated";
  count: number;
  revenue: number;
  avgSpending: number;
}

export interface CustomerRetentionItem {
  repeatCustomerRate: number;
  newCustomersRate: number;
  returningCustomersRate: number;
  newCustomersCount: number;
  returningCustomersCount: number;
  totalCustomers: number;
  avgVisitsPerCustomer: number;
}

export interface GuestReportItem {
  guestId: string;
  guest: string;
  email: string;
  gender?: string;
  nationality?: string;
  memberStatus: "Bronze" | "Silver" | "Gold" | "Platinum";
  totalAmount: number;
  lastServiceDate?: string;
}

export async function getReportSummary(
  branchId: string,
  dateType: string = "bookingDate",
  startDate: string,
  endDate: string,
): Promise<ReportSummaryResponse | null> {
  try {
    const session = await auth();
    const accessToken = (session as any)?.accessToken;

    // Build query parameters
    const params = new URLSearchParams();
    params.append("branchId", branchId);
    params.append("dateType", dateType);
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const response = await fetch(
      `${API_BASE_URL}/reports/summary?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch report summary:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching report summary:", error);
    return null;
  }
}

export async function getBookingReport(
  branchId: string,
  dateType: string = "bookingDate",
  startDate: string,
  endDate: string,
): Promise<BookingReportItem[] | null> {
  try {
    const session = await auth();
    const accessToken = (session as any)?.accessToken;

    // Build query parameters
    const params = new URLSearchParams();
    params.append("branchId", branchId);
    params.append("dateType", dateType);
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const response = await fetch(
      `${API_BASE_URL}/reports/bookings?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch booking report:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching booking report:", error);
    return null;
  }
}

export async function getTopServicesReport(
  branchId: string,
  dateType: string = "bookingDate",
  startDate: string,
  endDate: string,
): Promise<TopServiceItem[] | null> {
  try {
    const session = await auth();
    const accessToken = (session as any)?.accessToken;

    // Build query parameters
    const params = new URLSearchParams();
    params.append("branchId", branchId);
    params.append("dateType", dateType);
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const response = await fetch(
      `${API_BASE_URL}/reports/top-services?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch top services report:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching top services report:", error);
    return null;
  }
}

export async function getCustomerSegmentsReport(
  branchId: string,
  dateType: string = "bookingDate",
  startDate: string,
  endDate: string,
): Promise<CustomerSegmentItem[] | null> {
  try {
    const session = await auth();
    const accessToken = (session as any)?.accessToken;

    // Build query parameters
    const params = new URLSearchParams();
    params.append("branchId", branchId);
    params.append("dateType", dateType);
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const response = await fetch(
      `${API_BASE_URL}/reports/customer-segments?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch customer segments report:",
        response.status,
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching customer segments report:", error);
    return null;
  }
}

export async function getCustomerRetentionReport(
  branchId: string,
  dateType: string = "bookingDate",
  startDate: string,
  endDate: string,
): Promise<CustomerRetentionItem | null> {
  try {
    const session = await auth();
    const accessToken = (session as any)?.accessToken;

    // Build query parameters
    const params = new URLSearchParams();
    params.append("branchId", branchId);
    params.append("dateType", dateType);
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const response = await fetch(
      `${API_BASE_URL}/reports/customer-retention?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch customer retention report:",
        response.status,
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching customer retention report:", error);
    return null;
  }
}

export async function getGuestReport(
  branchId: string,
  dateType: string = "bookingDate",
  startDate: string,
  endDate: string,
): Promise<GuestReportItem[] | null> {
  try {
    const session = await auth();
    const accessToken = (session as any)?.accessToken;

    // Build query parameters
    const params = new URLSearchParams();
    params.append("branchId", branchId);
    params.append("dateType", dateType);
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const response = await fetch(
      `${API_BASE_URL}/reports/guest-report?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch guest report:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching guest report:", error);
    return null;
  }
}
