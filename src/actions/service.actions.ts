"use server";

import { auth } from "@/auth";
import { CreateServiceFormData } from "@/schemas/service.schema";
import { revalidatePath } from "next/cache";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getServiceCategories(branchId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }
    const response = await fetch(
      `${API_BASE_URL}/services/categories/all/${branchId}`,
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
      console.error("Failed to fetch categories");
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Get service categories error:", error);
    return [];
  }
}

export async function getServices(
  branchId: string,
  page?: number | string,
  limit?: number | string,
  search?: string,
  categoryId?: string,
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
    if (categoryId) params.append("categoryId", categoryId);

    const response = await fetch(
      `${API_BASE_URL}/services?${params.toString()}`,
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
      console.error("Failed to fetch services");
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Get services error:", error);
    return [];
  }
}

export async function createService(
  accessBranchId: string,
  branchId: string | string[],
  data: CreateServiceFormData,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    // Create service for the first branch (with all data)
    const firstBranchPayload = {
      ...data,
      mainBranchId: accessBranchId,
      branchId: Array.isArray(branchId) ? branchId : [branchId],
    };

    const response = await fetch(`${API_BASE_URL}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify(firstBranchPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || "Failed to create service";
      throw new Error(errorMessage);
    }

    const createdService = await response.json();

    revalidatePath(`/dashboard/services`);
    return createdService;
  } catch (error) {
    console.error("Create service error:", error);
    throw error;
  }
}

export async function updateService(
  serviceId: string,
  data: Partial<CreateServiceFormData>,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update service");
    }

    revalidatePath(`/dashboard/services`);
    return await response.json();
  } catch (error) {
    console.error("Update service error:", error);
    throw error;
  }
}

export async function deleteService(serviceId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete service");
    }
    revalidatePath(`/dashboard/services`);

    return await response.json();
  } catch (error) {
    console.error("Delete service error:", error);
    throw error;
  }
}

export async function updateServiceOrder(
  services: Array<{ id: string; displayOrder: number }>,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/services/batch/reorder`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify({ services }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update service order");
    }

    revalidatePath(`/dashboard/services`);
    return await response.json();
  } catch (error) {
    console.error("Update service order error:", error);
    throw error;
  }
}
