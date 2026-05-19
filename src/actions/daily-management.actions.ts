"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { StaffDayOff, ApiResponse, PaginationMeta } from "@/types/api";

export async function getStaffDayOffs(
  branchId: string,
  page?: number | string,
  limit?: number | string,
  search?: string,
): Promise<ApiResponse<StaffDayOff[]>> {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Build query string with pagination and filter parameters
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", String(page));
    if (limit !== undefined) params.append("limit", String(limit));
    if (search) params.append("search", search);

    const queryString = params.toString();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const url = `${apiUrl}/staff-dayoff${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch staff day-offs: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Transform API response to match our interface
    let dayOffs: StaffDayOff[] = [];
    let meta: PaginationMeta | undefined;

    if (Array.isArray(data)) {
      // Non-paginated response (backward compatibility)
      dayOffs = data.map((item: any) => ({
        id: item.id,
        date: item.date,
        staffId: item.staffId || item.staff?.id || "",
        staffName: item.staff
          ? `${item.staff.firstName} ${item.staff.lastName}`
          : "Unknown",
        reason: item.reason,
        status: item.status || "pending",
      }));
    } else if (data.data && Array.isArray(data.data)) {
      // Paginated response
      dayOffs = data.data.map((item: any) => ({
        id: item.id,
        date: item.date,
        staffId: item.staffId || item.staff?.id || "",
        staffName: item.staff
          ? `${item.staff.firstName} ${item.staff.lastName}`
          : "Unknown",
        reason: item.reason,
        status: item.status || "pending",
      }));
      meta = data.meta;
    }

    return {
      success: true,
      data: dayOffs,
      ...(meta && { meta }),
    };
  } catch (error) {
    console.error("Error fetching staff day-offs:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function createStaffDayOff(
  branchId: string,
  data: {
    date: string;
    staffId: string;
    reason: string;
    status: string;
    note?: string;
  },
): Promise<ApiResponse<any>> {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/staff-dayoff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify({
        date: data.date,
        staffId: data.staffId,
        reason: data.reason,
        status: data.status,
        note: data.note || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message ||
          `Failed to create staff day-off: ${response.statusText}`,
      };
    }

    const result = await response.json();
    revalidatePath(`/dashboard/${branchId}/daily-management`);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error creating staff day-off:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function updateStaffDayOff(
  branchId: string,
  dayOffId: string,
  data: {
    date: string;
    staffId: string;
    reason: string;
    status: string;
    note?: string;
  },
): Promise<ApiResponse<any>> {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/staff-dayoff/${dayOffId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify({
        date: data.date,
        staffId: data.staffId,
        reason: data.reason,
        status: data.status,
        note: data.note || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message ||
          `Failed to update staff day-off: ${response.statusText}`,
      };
    }

    const result = await response.json();
    revalidatePath(`/dashboard/${branchId}/daily-management`);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error updating staff day-off:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function deleteStaffDayOff(
  branchId: string,
  dayOffId: string,
): Promise<ApiResponse<any>> {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/staff-dayoff/${dayOffId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message ||
          `Failed to delete staff day-off: ${response.statusText}`,
      };
    }

    revalidatePath(`/dashboard/${branchId}/daily-management`);
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error deleting staff day-off:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function createPriceOverride(
  branchId: string,
  data: {
    itemType: "service" | "package" | "programme";
    itemId: string;
    startDate: Date;
    endDate: Date;
    newPrice: number;
  },
): Promise<ApiResponse<any>> {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const payload: Record<string, any> = {
      overrideStartDate: data.startDate,
      overrideEndDate: data.endDate,
      price: data.newPrice,
    };

    if (data.itemType === "service") {
      payload.subServiceId = data.itemId;
    } else if (data.itemType === "package") {
      payload.packageId = data.itemId;
    } else if (data.itemType === "programme") {
      payload.programmeId = data.itemId;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/price-overrides`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message ||
          `Failed to create price override: ${response.statusText}`,
      };
    }

    const result = await response.json();
    revalidatePath(`/dashboard/${branchId}/daily-management`);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error creating price override:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function getPriceOverrides(
  branchId: string,
  filters?: {
    search?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<ApiResponse<any[]>> {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Build query string with pagination and filter parameters
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const queryString = params.toString();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const url = `${apiUrl}/price-overrides${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        branchId: branchId,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch price overrides: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Transform API response to match our interface
    let priceOverrides: any[] = [];
    let meta: PaginationMeta | undefined;

    if (Array.isArray(data)) {
      // Non-paginated response (backward compatibility)
      priceOverrides = data.map((item: any) => ({
        id: item.id,
        date: item.overrideStartDate,
        endDate: item.overrideEndDate,
        type: item.subService
          ? "service"
          : item.package
            ? "package"
            : "programme",
        itemName: item.subService
          ? `${item.subService?.service?.name} - ${item.subService?.name}`
          : item.package
            ? item.package?.name
            : item.programme
              ? item.programme?.name
              : "Unknown",
        originalPrice:
          item.subService?.price ||
          item.package?.price ||
          item.programme?.price ||
          0,
        newPrice: item.price,
        status: "active",
        serviceId: item.subService?.id,
        packageId: item.package?.id,
        programmeId: item.programme?.id,
      }));
    } else if (data.data && Array.isArray(data.data)) {
      // Paginated response
      priceOverrides = data.data.map((item: any) => ({
        id: item.id,
        date: item.overrideStartDate,
        endDate: item.overrideEndDate,
        type: item.subService
          ? "service"
          : item.package
            ? "package"
            : "programme",
        itemName:
          item.subService?.name ||
          item.package?.name ||
          item.programme?.name ||
          "Unknown",
        originalPrice:
          item.subService?.basePrice ||
          item.package?.price ||
          item.programme?.price ||
          0,
        newPrice: item.price,
        status: "active",
        serviceId: item.subService?.id,
        packageId: item.package?.id,
        programmeId: item.programme?.id,
      }));
      meta = data.meta;
    }

    return {
      success: true,
      data: priceOverrides,
      ...(meta && { meta }),
    };
  } catch (error) {
    console.error("Error fetching price overrides:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function updatePriceOverride(
  branchId: string,
  priceOverrideId: string,
  data: {
    startDate?: Date;
    endDate?: Date;
    newPrice?: number;
  },
): Promise<ApiResponse<any>> {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const payload: Record<string, any> = {};

    if (data.startDate) payload.overrideStartDate = data.startDate;
    if (data.endDate) payload.overrideEndDate = data.endDate;
    if (data.newPrice !== undefined) payload.price = data.newPrice;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(
      `${apiUrl}/price-overrides/${priceOverrideId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          branchId: branchId,
          "spa-id": session.spaIds?.[0] || "",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message ||
          `Failed to update price override: ${response.statusText}`,
      };
    }

    const result = await response.json();
    revalidatePath(`/dashboard/${branchId}/daily-management`);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error updating price override:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function deletePriceOverride(
  branchId: string,
  priceOverrideId: string,
): Promise<ApiResponse<any>> {
  try {
    const session = await auth();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(
      `${apiUrl}/price-overrides/${priceOverrideId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          branchId: branchId,
          "spa-id": session.spaIds?.[0] || "",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          error.message ||
          `Failed to delete price override: ${response.statusText}`,
      };
    }

    revalidatePath(`/dashboard/${branchId}/daily-management`);
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error deleting price override:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
