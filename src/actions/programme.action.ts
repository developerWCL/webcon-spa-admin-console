"use server";

import { auth } from "@/auth";
import { PaginationParams } from "@/types/api/common";

interface CreateProgrammePayload {
  branchId: string;
  name: string;
  description: string;
  price: number;
  translations: Array<{
    languageCode: string;
    name: string;
    description: string;
  }>;
  steps: Array<{
    title: string;
    description: string;
    duration: string;
    translations: Array<{
      languageCode: string;
      title: string;
      description: string;
    }>;
  }>;
  mediaIds: string[];
}

interface UpdateProgrammePayload extends CreateProgrammePayload {
  id: string;
}

export async function getProgrammesAction(
  branchId: string,
  params?: PaginationParams & { search?: string; status?: string },
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error("API URL not configured");
    }

    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const queryParams = new URLSearchParams();
    queryParams.set("branchId", branchId);
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.search) queryParams.set("search", params.search);
    if (params?.status) queryParams.set("status", params.status);

    const response = await fetch(
      `${baseUrl}/programmes?${queryParams.toString()}`,
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to fetch programmes: ${response.status}`,
      );
    }

    const result = await response.json();

    return {
      success: true,
      data: result,
      error: null,
      message: "Programmes fetched successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[ERROR] Failed to fetch programmes:", errorMessage);

    return {
      success: false,
      data: null,
      error: errorMessage,
      message: "Failed to fetch programmes",
    };
  }
}

export async function createProgrammeAction(payload: CreateProgrammePayload) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programmes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "spa-id": session.spaIds?.[0] || "",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `API error: ${response.statusText}`);
    }

    const createdProgramme = await response.json();

    return {
      success: true,
      data: createdProgramme,
      message: "Programme created successfully",
    };
  } catch (error) {
    console.error("[API] Error creating programme:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create programme";

    return {
      success: false,
      error: errorMessage,
      message: "Failed to create programme",
    };
  }
}

export async function updateProgrammeAction(
  payload: UpdateProgrammePayload & { isOverride?: boolean },
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const { id, ...updateData } = payload;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programmes/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "spa-id": session.spaIds?.[0] || "",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `API error: ${response.statusText}`);
    }

    const updatedProgramme = await response.json();

    return {
      success: true,
      data: updatedProgramme,
      message: "Programme updated successfully",
    };
  } catch (error) {
    console.error("[API] Error updating programme:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update programme";

    return {
      success: false,
      error: errorMessage,
      message: "Failed to update programme",
    };
  }
}

export async function deleteProgrammeAction(id: string, branchId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programmes/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "spa-id": session.spaIds?.[0] || "",
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.statusText}`);
    }

    return {
      success: true,
      message: "Programme deleted successfully",
    };
  } catch (error) {
    console.error("[API] Error deleting programme:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete programme";

    return {
      success: false,
      error: errorMessage,
      message: "Failed to delete programme",
    };
  }
}

export async function updateProgrammeOrder(
  programmes: Array<{ id: string; displayOrder: number }>,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programmes/batch/reorder`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          "spa-id": session.spaIds?.[0] || "",
        },
        body: JSON.stringify({ programmes }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update programme order");
    }

    return await response.json();
  } catch (error) {
    console.error("Update programme order error:", error);
    throw error;
  }
}
