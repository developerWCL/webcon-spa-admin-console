"use server";

import { auth } from "@/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface CreateRoomBedClosureDTO {
  roomId?: string;
  bedId?: string;
  closureDate: string;
  reason: string;
}

export interface RoomBedClosure {
  id: string;
  roomId?: string;
  bedId?: string;
  closureDate: string;
  reason: string;
  room?: {
    id: string;
    name: string;
  };
  bed?: {
    id: string;
    name: string;
  };
}

export interface PaginatedClosuresResponse {
  data: RoomBedClosure[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function createRoomBedClosure(
  branchId: string,
  data: CreateRoomBedClosureDTO,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    // Find room ID from room name if bedId is selected
    let roomId = data.roomId;
    let bedId = data.bedId;

    const payload = {
      roomId: roomId || undefined,
      bedId: bedId || undefined,
      closureDate: data.closureDate,
      reason: data.reason,
    };

    const response = await fetch(`${API_BASE_URL}/room-bed-closures`, {
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
        errorData.message || errorData.error || "Failed to create closure";
      throw new Error(errorMessage);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error("Create room bed closure error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function getRoomBedClosures(filters?: {
  roomId?: string;
  bedId?: string;
  fromDate?: string;
  toDate?: string;
  branchId?: string;
  search?: string;
}) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    // Build query parameters
    const params = new URLSearchParams({});

    if (filters?.branchId) {
      params.append("branchId", filters.branchId);
    }
    if (filters?.roomId) {
      params.append("roomId", filters.roomId);
    }
    if (filters?.bedId) {
      params.append("bedId", filters.bedId);
    }
    if (filters?.fromDate) {
      params.append("fromDate", filters.fromDate);
    }
    if (filters?.toDate) {
      params.append("toDate", filters.toDate);
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }

    const response = await fetch(
      `${API_BASE_URL}/room-bed-closures?${params.toString()}`,
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
      const errorMessage =
        errorData.message || errorData.error || "Failed to fetch closures";
      throw new Error(errorMessage);
    }

    const data = await response.json();

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Get room bed closures error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }
}

export async function deleteRoomBedClosure(closureId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(
      `${API_BASE_URL}/room-bed-closures/${closureId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          "spa-id": session.spaIds?.[0] || "",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || "Failed to delete closure";
      throw new Error(errorMessage);
    }

    return {
      success: true,
      message: "Closure deleted successfully",
    };
  } catch (error) {
    console.error("Delete room bed closure error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
