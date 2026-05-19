"use server";

import { auth } from "@/auth";
import {
  CreatePackageFormValues,
  UpdatePackageFormValues,
} from "@/schemas/package.schema";
import { revalidatePath } from "next/cache";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getPackages(
  branchId: string,
  page?: number | string,
  limit?: number | string,
  search?: string,
  status?: string,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    // Build query string with pagination and filter parameters
    const params = new URLSearchParams({ branchId });
    if (page !== undefined) params.append("page", String(page));
    if (limit !== undefined) params.append("limit", String(limit));
    if (search) params.append("search", search);
    if (status) params.append("status", status);

    const response = await fetch(
      `${API_BASE_URL}/packages?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          "spa-id": session.spaIds?.[0] || "",
        },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch packages");
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Get packages error:", error);
    return [];
  }
}

export async function getPackageById(packageId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/packages/${packageId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch package");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Get package error:", error);
    return null;
  }
}

export async function getPackageActiveServices(packageId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(
      `${API_BASE_URL}/packages/${packageId}/active-services`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          "spa-id": session.spaIds?.[0] || "",
        },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch active services");
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Get active services error:", error);
    return [];
  }
}

export async function createPackage(
  accessBranchId: string,
  branchId: string | string[],
  data: CreatePackageFormValues,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    // Handle both single branch and multiple branches
    const branchIds = Array.isArray(branchId) ? branchId : [branchId];

    // Create package for the first branch (with all data)
    const payload = {
      ...data,
      mainBranchId: accessBranchId,
      branchId: branchIds,
    };

    const response = await fetch(`${API_BASE_URL}/packages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || "Failed to create package";
      throw new Error(errorMessage);
    }

    const createdPackage = await response.json();
    revalidatePath(`/dashboard/packages`);
    return createdPackage;
  } catch (error) {
    console.error("Create package error:", error);
    throw error;
  }
}

export async function updatePackage(
  packageId: string,
  branchId: string,
  data: UpdatePackageFormValues & { isOverride?: boolean },
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/packages/${packageId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify({ ...data, branchId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update package");
    }
    const res = await response.json();

    revalidatePath(`/dashboard/packages`);
    return res;
  } catch (error) {
    console.error("Update package error:", error);
    throw error;
  }
}

export async function deletePackage(packageId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/packages/${packageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete package");
    }

    revalidatePath(`/dashboard/packages`);
    return await response.json();
  } catch (error) {
    console.error("Delete package error:", error);
    throw error;
  }
}
