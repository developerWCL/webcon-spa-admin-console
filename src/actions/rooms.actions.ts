"use server";

import { auth } from "@/auth";
import { CreateRoomFormData } from "@/schemas/room.schema";
import { revalidatePath } from "next/cache";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getRooms(
  branchId: string,
  page?: number | string,
  limit?: number | string,
  search?: string,
  status?: string,
  date?: string,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (search && search != undefined) params.append("search", search);
    if (status && status != undefined) params.append("status", status);
    if (date && date != undefined) params.append("date", date);
    params.append("branchId", branchId);

    const response = await fetch(`${API_BASE_URL}/rooms?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch rooms");
      return { success: false, error: "Failed to fetch rooms", data: [] };
    }

    const result = await response.json();

    // Transform backend pagination format to frontend format
    const pagination = result.meta
      ? {
          currentPage: result.meta.currentPage,
          totalPages: result.meta.totalPages,
          total: result.meta.totalItems,
          limit: result.meta.itemsPerPage,
        }
      : result.pagination;

    return {
      success: true,
      data: result.data || result,
      pagination,
    };
  } catch (error) {
    console.error("Get rooms error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      data: [],
    };
  }
}

export async function createRoom(branchId: string, data: CreateRoomFormData) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const payload = {
      ...data,
      branchId: branchId,
    };

    const response = await fetch(`${API_BASE_URL}/rooms`, {
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
        errorData.message || errorData.error || "Failed to create room";
      throw new Error(errorMessage);
    }

    revalidatePath(`/dashboard/inventory`);
    return { success: true, data: await response.json() };
  } catch (error) {
    console.error("Create room error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function updateRoom(roomId: string, data: CreateRoomFormData) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || "Failed to update room";
      throw new Error(errorMessage);
    }

    revalidatePath(`/dashboard/inventory`);
    return { success: true, data: await response.json() };
  } catch (error) {
    console.error("Update room error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function deleteRoom(roomId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || "Failed to delete room";
      throw new Error(errorMessage);
    }

    revalidatePath(`/dashboard/inventory`);
    return { success: true, message: "Room deleted successfully" };
  } catch (error) {
    console.error("Delete room error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
