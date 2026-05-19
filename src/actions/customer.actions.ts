"use server";

import { auth } from "@/auth";
import { EditGuestFormData } from "@/components/dialogs/edit-guest-dialog";
import { Customer } from "@/types";
import { revalidatePath } from "next/cache";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Spa {
  id: string;
  companyId: string;
  companyName: string;
  billingEmail: string;
  metadata: Record<string, any>;
  name: string;
  phone: string;
  email: string;
  website: string;
  status: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface GuestCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  isVerified: boolean;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  specialRequest: string | null;
  email: string;
  phone: string;
  nationality: string | null;
  gender: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  spa: Spa;
  customer: GuestCustomer;
  bookingItems: any[]; // Adjust type as needed
}

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  isVerified: boolean;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CustomerListResponse {
  success: boolean;
  data?: Guest[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: string;
}

export interface AppUserListResponse {
  success: boolean;
  data?: AppUser[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: string;
}

export interface CustomerResponse {
  success: boolean;
  data?: Guest;
  error?: string;
}

// Transform API response to match component expectations
function transformCustomerData(rawData: Guest): Guest {
  return rawData;
}

export async function getAppUsers(
  branchId: string,
  page?: number | string,
  limit?: number | string,
  search?: string,
): Promise<AppUserListResponse> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    // Build query string with pagination and filter parameters
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", String(page));
    if (limit !== undefined) params.append("limit", String(limit));
    if (search) params.append("search", search);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/admin/customers${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message || `Failed to fetch app users: ${response.statusText}`,
      };
    }

    const responseData = await response.json();

    // Handle both paginated and non-paginated responses
    if (Array.isArray(responseData)) {
      // Non-paginated response (backward compatibility)
      return { success: true, data: responseData };
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // Paginated response
      return {
        success: true,
        data: responseData.data,
        meta: responseData.meta,
      };
    } else {
      // Unexpected response format
      return { success: true, data: [] };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load app user data";
    console.error("Error fetching app users:", error);
    return { success: false, error: errorMessage };
  }
}

export async function getCustomers(
  branchId: string,
  page?: number | string,
  limit?: number | string,
  search?: string,
): Promise<CustomerListResponse> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    // Build query string with pagination and filter parameters
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", String(page));
    if (limit !== undefined) params.append("limit", String(limit));
    if (search) params.append("search", search);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/guests${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message || `Failed to fetch customers: ${response.statusText}`,
      };
    }

    const responseData = await response.json();

    // Handle both paginated and non-paginated responses
    if (Array.isArray(responseData)) {
      // Non-paginated response (backward compatibility)
      const transformedData = responseData.map(transformCustomerData);
      return { success: true, data: transformedData };
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // Paginated response
      const transformedData = responseData.data.map(transformCustomerData);
      return {
        success: true,
        data: transformedData,
        meta: responseData.meta,
      };
    } else {
      // Unexpected response format
      return { success: true, data: [] };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load customer data";
    console.error("Error fetching customers:", error);
    return { success: false, error: errorMessage };
  }
}

export async function createCustomer(
  branchId: string,
  customerData: any,
): Promise<CustomerResponse> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const payload = {
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email,
      phone: customerData.phone,
      specialRequest: customerData.specialRequest || null,
      nationality: customerData.nationality || null,
      gender: customerData.gender,
      spaId: session.spaIds?.[0] || "",
    };

    const response = await fetch(`${API_BASE_URL}/guests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message || `Failed to create customer: ${response.statusText}`,
      };
    }

    const responseData = await response.json();
    const transformedData = transformCustomerData(responseData);

    revalidatePath(`/[branchId]/dashboard/customers`);

    return { success: true, data: transformedData };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create customer";
    console.error("Error creating customer:", error);
    return { success: false, error: errorMessage };
  }
}

export async function updateCustomer(
  customerId: string,
  branchId: string,
  customerData: EditGuestFormData,
): Promise<CustomerResponse> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/guests/${customerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      body: JSON.stringify({
        ...customerData,
        spaId: session.spaIds?.[0] || "",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message || `Failed to update customer: ${response.statusText}`,
      };
    }

    const responseData = await response.json();
    const transformedData = transformCustomerData(responseData);

    revalidatePath(`/[branchId]/dashboard/customers`);

    return { success: true, data: transformedData };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update customer";
    console.error("Error updating customer:", error);
    return { success: false, error: errorMessage };
  }
}

export async function deleteCustomer(
  customerId: string,
  branchId: string,
): Promise<CustomerResponse> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/guests/${customerId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message || `Failed to delete customer: ${response.statusText}`,
      };
    }

    revalidatePath(`/[branchId]/dashboard/customers`);

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete customer";
    console.error("Error deleting customer:", error);
    return { success: false, error: errorMessage };
  }
}
