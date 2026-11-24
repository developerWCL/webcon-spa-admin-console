"use server";

import { auth } from "@/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type ClosureItemType = "service" | "package" | "programme";

export interface CreateServiceClosureDTO {
  startClosure: string;
  endClosure: string;
  reason?: string;
  services?: string[];
  packages?: string[];
  programmes?: string[];
  isCloseAll?: boolean;
}

export interface UpdateServiceClosureDTO {
  startClosure?: string;
  endClosure?: string;
  reason?: string;
  services?: string[];
  packages?: string[];
  programmes?: string[];
  isCloseAll?: boolean;
}

export interface ServiceClosure {
  id: string;
  startClosure: string;
  endClosure: string;
  closeDate?: string;
  closeTime?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  reason?: string | null;
  services?: {
    id: string;
    name: string;
  }[];
  packages?: {
    id: string;
    name: string;
  }[];
  programmes?: {
    id: string;
    name: string;
  }[];
  isCloseAll?: boolean;
}

export async function deleteServiceClosure(closureId: string) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/service-closures/${closureId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          errorData.error ||
          "Failed to delete service closure"
      );
    }

    return {
      success: true,
      data: await response.json().catch(() => null),
    };
  } catch (error) {
    console.error("Delete service closure error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete service closure",
    };
  }
}

export async function createServiceClosure(data: CreateServiceClosureDTO) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/service-closures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || "Failed to create service closure"
      );
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error("Create service closure error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create service closure",
    };
  }
}

export async function updateServiceClosure(
  closureId: string,
  data: UpdateServiceClosureDTO
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/service-closures/${closureId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || "Failed to update service closure"
      );
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error("Update service closure error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update service closure",
    };
  }
}

export async function getServiceClosure() {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await fetch(`${API_BASE_URL}/service-closures`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || "Failed to create service closure"
      );
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error("Create service closure error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create service closure",
    };
  }
}
