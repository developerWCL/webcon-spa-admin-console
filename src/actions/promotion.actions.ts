"use server";

import { auth } from "@/auth";
import {
  PromotionFormData,
  UpdatePromotionFormData,
} from "@/schemas/promotion.schema";
import { log } from "console";
import { revalidatePath } from "next/cache";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getPromotions(
  branchId: string,
  page?: number | string,
  limit?: number | string,
  search?: string,
  status?: string,
  serviceIds?: string[],
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
    if (serviceIds && serviceIds.length > 0) {
      serviceIds.forEach((id) => params.append("serviceIds", id));
    }

    const response = await fetch(
      `${API_BASE_URL}/promotions?${params.toString()}`,
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
      console.error("Failed to fetch promotions");
      return [];
    }
    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Get promotions error:", error);
    return [];
  }
}

export async function getPromotionById(promotionId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch promotion");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Get promotion error:", error);
    return null;
  }
}

export async function createPromotion(
  branchId: string,
  data: PromotionFormData,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    // Ensure branchId is included in the request body
    const payload = {
      ...data,
      branchId: branchId,
    };

    const response = await fetch(`${API_BASE_URL}/promotions`, {
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
        errorData.message || errorData.error || "Failed to create promotion";
      throw new Error(errorMessage);
    }

    revalidatePath(`/dashboard/promotions`);
    return await response.json();
  } catch (error) {
    console.error("Create promotion error:", error);
    throw error;
  }
}

export async function updatePromotion(
  promotionId: string,
  data: UpdatePromotionFormData,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}`, {
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
      throw new Error(error.message || "Failed to update promotion");
    }

    revalidatePath(`/dashboard/promotions`);
    return await response.json();
  } catch (error) {
    console.error("Update promotion error:", error);
    throw error;
  }
}

export async function deletePromotion(promotionId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      let errorMessage = "Failed to delete promotion";
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        // If response body is empty, keep default error message
      }
      throw new Error(errorMessage);
    }

    revalidatePath(`/dashboard/promotions`);

    return { success: true };
  } catch (error) {
    console.error("Delete promotion error:", error);
    throw error;
  }
}
