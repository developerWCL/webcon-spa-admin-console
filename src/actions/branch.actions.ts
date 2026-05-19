"use server";

import { auth } from "@/auth";
import { Branch } from "@/types";
import type { CreateBranchRequest, UpdateBranchRequest } from "@/types/api";
import { revalidatePath } from "next/cache";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Transform API response to match component expectations
function transformBranchData(rawData: any[]): Branch[] {
  return rawData.map((branch) => ({
    id: branch.id,
    spaId: branch.spaId,
    name: branch.name,
    location: branch.location,
    phone: branch.phone,
    email: branch.email,
    isActive: branch.isActive ?? true,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
    media: branch.media,
    operatingHours: branch.operatingHours,
  }));
}

export async function getBranchById(branchId: string): Promise<{
  success: boolean;
  data?: Branch;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/branches/${branchId}`, {
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

    return { success: true, data: data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load branches";
    console.error("Error fetching branches:", error);
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

    if (!session?.user?.id || !session?.accessToken) {
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

    // Handle both array and wrapped responses
    const branches = Array.isArray(data)
      ? data
      : data.branches || data.data || [];
    const transformedData = transformBranchData(branches);
    return { success: true, data: transformedData };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load branches";
    console.error("Error fetching branches:", error);
    return { success: false, error: errorMessage };
  }
}

export async function selectBranch(branchId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(
      `${API_BASE_URL}/staff/${session.user.id}/branches/${branchId}/select`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          "spa-id": session.spaIds?.[0] || "",
        },
        credentials: "include",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || "Failed to select branch",
      };
    }

    revalidatePath("/select-branch");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to select branch";
    console.error("Error selecting branch:", error);
    return { success: false, error: errorMessage };
  }
}

export async function getAllBranches(): Promise<{
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
    const branches = Array.isArray(data)
      ? data
      : data.branches || data.data || [];
    const transformedData = transformBranchData(branches);
    return { success: true, data: transformedData };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load branches";
    console.error("Error fetching branches:", error);
    return { success: false, error: errorMessage };
  }
}

export async function createBranch(
  branchData: CreateBranchRequest,
): Promise<{ success: boolean; data?: Branch; error?: string }> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/branches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      body: JSON.stringify(branchData),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || "Failed to create branch",
      };
    }

    const data = await response.json();
    revalidatePath("/dashboard/settings");
    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create branch";
    console.error("Error creating branch:", error);
    return { success: false, error: errorMessage };
  }
}

export async function updateBranch(
  id: string,
  branchData: UpdateBranchRequest,
): Promise<{ success: boolean; data?: Branch; error?: string }> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      credentials: "include",
      body: JSON.stringify(branchData),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || "Failed to update branch",
      };
    }

    const data = await response.json();
    revalidatePath("/dashboard/settings");
    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update branch";
    console.error("Error updating branch:", error);
    return { success: false, error: errorMessage };
  }
}

export async function deleteBranch(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
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
        error: error.message || "Failed to delete branch",
      };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete branch";
    console.error("Error deleting branch:", error);
    return { success: false, error: errorMessage };
  }
}
