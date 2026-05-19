"use server";

import { auth } from "@/auth";
import { ApiResponse } from "@/types";
import { format } from "date-fns";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface ActionLog {
  id: string;
  actionDate: string;
  feature: string;
  subFeature: string | null;
  actionType: "create" | "update" | "delete";
  actorId: string;
  actorName: string | null;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  status: "success" | "failure";
  newData: Record<string, any> | null;
  oldData: Record<string, any> | null;
  branchId: string | null;
}

export interface ActionLogsResponse {
  data: ActionLog[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export async function getActionLogs(
  page?: number | string,
  limit?: number | string,
  feature?: string,
  actionType?: string,
  status?: string,
  branchId?: string,
  fromDate?: string,
  toDate?: string,
): Promise<ApiResponse<ActionLogsResponse>> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return {
        success: false,
        error: "Unauthorized",
        data: {
          data: [],
          meta: {
            totalItems: 0,
            itemCount: 0,
            itemsPerPage: 20,
            totalPages: 0,
            currentPage: 1,
          },
        },
      };
    }

    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (feature) params.append("feature", feature);
    if (actionType) params.append("actionType", actionType);
    if (status) params.append("status", status);
    if (branchId) params.append("branchId", branchId);
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);

    const response = await fetch(
      `${API_BASE_URL}/admin/action-logs?${params.toString()}`,
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
      console.error("Failed to fetch action logs");
      return {
        success: false,
        error: "Failed to fetch action logs",
        data: {
          data: [],
          meta: {
            totalItems: 0,
            itemCount: 0,
            itemsPerPage: 20,
            totalPages: 0,
            currentPage: 1,
          },
        },
      };
    }

    const result = await response.json();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get action logs error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      data: {
        data: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 20,
          totalPages: 0,
          currentPage: 1,
        },
      },
    };
  }
}

export async function exportActionLogsToExcel(
  feature?: string,
  actionType?: string,
  status?: string,
  fromDate?: string,
  toDate?: string,
): Promise<ApiResponse<{ filename: string; content: string }>> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return {
        success: false,
        error: "Unauthorized",
        data: { filename: "", content: "" },
      };
    }

    // Fetch all logs with high limit for export
    const params = new URLSearchParams();
    params.append("page", "1");
    params.append("limit", "10000"); // High limit to export all records
    if (feature) params.append("feature", feature);
    if (actionType) params.append("actionType", actionType);
    if (status) params.append("status", status);
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);

    const response = await fetch(
      `${API_BASE_URL}/admin/action-logs?${params.toString()}`,
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
      console.error("Failed to fetch action logs for export");
      return {
        success: false,
        error: "Failed to fetch action logs for export",
        data: { filename: "", content: "" },
      };
    }

    const result = await response.json();
    const logs: ActionLog[] = result.data || [];

    // Convert logs to CSV format
    const headers = [
      "Date/Time",
      "Feature",
      "Action Type",
      "Actor Name",
      "Entity Type",
      "Entity ID",
      "Status",
      "Description",
    ];

    const rows = logs.map((log) => [
      format(new Date(log.actionDate), "MMM d, yyyy HH:mm:ss"),
      log.feature || "",
      log.actionType || "",
      log.actorName || "",
      log.entityType || "",
      log.entityId || "",
      log.status || "",
      log.description || "",
    ]);

    // Create CSV content
    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const timestamp = format(new Date(), "yyyy-MM-dd-HH-mm-ss");
    const filename = `action-logs-${timestamp}.csv`;

    return {
      success: true,
      data: {
        filename,
        content: csvContent,
      },
    };
  } catch (error) {
    console.error("Export action logs error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      data: { filename: "", content: "" },
    };
  }
}
