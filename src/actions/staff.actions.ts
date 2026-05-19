"use server";

import { auth } from "@/auth";
import {
  Branch,
  CreateStaffRequest,
  Role,
  Staff,
  StaffListResponse,
} from "@/types";
import { revalidatePath } from "next/cache";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Transform API response to match component expectations
function transformStaffData(rawData: any[]): Staff[] {
  return rawData.map((staff) => ({
    id: staff.id,
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: staff.email,
    phone: staff.phone,
    specialties: staff.specialties,
    workingHours: staff.workingHours,
    password: staff.passwordHash,
    isActive: staff.isActive,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
    branches: staff.branches || [],
    roles: staff.roles || [],
  }));
}

export async function getStaffMembers(
  branchId: string,
  page?: number | string,
  limit?: number | string,
  search?: string,
  isActive?: boolean,
  date?: string,
): Promise<StaffListResponse> {
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
    if (isActive !== undefined) params.append("isActive", String(isActive));
    if (date) params.append("date", date);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/admin/staffs${queryString ? `?${queryString}` : ""}`;

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
        error: error.message || `Failed to fetch staff: ${response.statusText}`,
      };
    }

    const responseData = await response.json();

    // Handle both paginated and non-paginated responses
    if (Array.isArray(responseData)) {
      // Non-paginated response (backward compatibility)
      const transformedData = transformStaffData(responseData);
      return { success: true, data: transformedData };
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // Paginated response
      const transformedData = transformStaffData(responseData.data);

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
      error instanceof Error ? error.message : "Failed to load staff data";
    console.error("Error fetching staff:", error);
    return { success: false, error: errorMessage };
  }
}

export async function createStaffMember(
  staffData: CreateStaffRequest,
): Promise<{ success: boolean; data?: Staff; error?: string }> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/admin/staffs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      body: JSON.stringify(staffData),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || "Failed to create staff member",
      };
    }

    const data = await response.json();
    revalidatePath("/dashboard/staff");
    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create staff member";
    console.error("Error creating staff:", error);
    return { success: false, error: errorMessage };
  }
}

export async function updateStaffMember(
  id: string,
  staffData: Partial<Staff>,
): Promise<{ success: boolean; data?: Staff; error?: string }> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/admin/staffs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      body: JSON.stringify(staffData),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || "Failed to update staff member",
      };
    }

    const data = await response.json();
    revalidatePath("/dashboard/staff");
    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update staff member";
    console.error("Error updating staff:", error);
    return { success: false, error: errorMessage };
  }
}

export async function deleteStaffMember(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/admin/staffs/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || "Failed to delete staff member",
      };
    }

    revalidatePath("/dashboard/staff");
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete staff member";
    console.error("Error deleting staff:", error);
    return { success: false, error: errorMessage };
  }
}

export async function getRoles(): Promise<{
  success: boolean;
  data?: Role[];
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/admin/roles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || `Failed to fetch roles: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load roles";
    console.error("Error fetching roles:", error);
    return { success: false, error: errorMessage };
  }
}

export async function getBranches(): Promise<{
  success: boolean;
  data?: Branch[];
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/branches`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
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
          error.message || `Failed to fetch branches: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load branches";
    console.error("Error fetching branches:", error);
    return { success: false, error: errorMessage };
  }
}
