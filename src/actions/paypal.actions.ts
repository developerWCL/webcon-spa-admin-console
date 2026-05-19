"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function getAuthHeaders() {
  const session = await auth();
  if (!session?.user?.id || !session?.accessToken) {
    throw new Error("Unauthorized");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.accessToken}`,
    "spa-id": session.spaIds?.[0] || "",
  };
}

export async function getPaypalAccounts(spaId: string) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/paypal-accounts?spaId=${spaId}`,
      { headers, cache: "no-store" },
    );
    if (!res.ok) {
      return { success: false, error: "Failed to fetch PayPal accounts" };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createPaypalAccount(payload: {
  spaId: string;
  label: string;
  clientId: string;
  clientSecret: string;
  webhookId?: string;
  mode: "sandbox" | "live";
  branchIds?: string[];
}) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/paypal-accounts`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || "Failed to create PayPal account",
      };
    }
    const data = await res.json();
    revalidatePath("/dashboard/settings");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updatePaypalAccount(
  id: string,
  payload: {
    label?: string;
    clientId?: string;
    clientSecret?: string;
    webhookId?: string;
    mode?: "sandbox" | "live";
    isActive?: boolean;
  },
) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/paypal-accounts/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || "Failed to update PayPal account",
      };
    }
    const data = await res.json();
    revalidatePath("/dashboard/settings");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deletePaypalAccount(id: string) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/paypal-accounts/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) {
      return { success: false, error: "Failed to delete PayPal account" };
    }
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function assignBranches(
  accountId: string,
  branchIds: string[],
) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/paypal-accounts/${accountId}/branches`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ branchIds }),
      },
    );
    if (!res.ok) {
      return { success: false, error: "Failed to assign branches" };
    }
    const data = await res.json();
    revalidatePath("/dashboard/settings");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function testPaypalConnection(id: string) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/paypal-accounts/${id}/test`,
      { method: "POST", headers },
    );
    if (!res.ok) {
      return { success: false, error: "Connection test failed" };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
