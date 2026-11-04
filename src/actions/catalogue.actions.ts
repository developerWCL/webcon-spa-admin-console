"use server";

import { auth } from "@/auth";
import { on } from "events";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type CatalogueType = "services" | "packages" | "programmes";

interface CatalogueItem {
  id: string;
  name: string;
  duration?: string;
}

/**
 * Fetch services, packages, or programmes for booking selection
 */
export async function getCatalogueItems(
  catalogueType: CatalogueType,
  branchId: string,
): Promise<{ success: boolean; data?: CatalogueItem[]; error?: string }> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized" };
    }

    const endpoint =
      catalogueType === "services"
        ? "services/sub-services"
        : catalogueType === "packages"
          ? "packages"
          : "programmes";

    const response = await fetch(
      `${API_BASE_URL}/${endpoint}?branchId=${branchId}`,
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
      console.error(`Failed to fetch ${catalogueType}`);
      return { success: false, error: `Failed to fetch ${catalogueType}` };
    }

    const result = await response.json();

    const items = (result.data || result || []).map((item: any) => ({
      id: item.id,
      serviceId: item?.service?.id || item.id, // For sub-services, use serviceId
      name: item.name,
      duration: item.durationMinutes || undefined,
      service: item?.service ? { name: item.service.name } : undefined, // For sub-services
      price: item.price || 0, // Include price for total calculation
      onlyPackage: item.onlyPackage || undefined,
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error(`Error fetching ${catalogueType}:`, error);
    return {
      success: false,
      error: `Error fetching ${catalogueType}: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
