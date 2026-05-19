"use server";

import { auth } from "@/auth";
import type { Language } from "@/types/api/language";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Get all active languages from the API
 */
export async function getActiveLanguages(): Promise<Language[]> {
  try {
    const session = await auth();

    const response = await fetch(`${API_BASE_URL}/languages/active`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch active languages");
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch active languages:", error);
    // Fallback to default languages if API fails
    return [
      {
        id: "default-en",
        code: "en",
        name: "English",
        isPrimary: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "default-th",
        code: "th",
        name: "Thai",
        isPrimary: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

/**
 * Get all languages (active and inactive)
 */
export async function getAllLanguages(): Promise<Language[]> {
  try {
    const session = await auth();

    const response = await fetch(`${API_BASE_URL}/languages?onlyActive=false`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch languages");
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch languages:", error);
    return [];
  }
}

/**
 * Get language by code
 */
export async function getLanguageByCode(
  code: string,
): Promise<Language | null> {
  try {
    const session = await auth();

    const response = await fetch(`${API_BASE_URL}/languages/code/${code}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch language with code ${code}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch language with code ${code}:`, error);
    return null;
  }
}

/**
 * Get primary language
 */
export async function getPrimaryLanguage(): Promise<Language | null> {
  try {
    const session = await auth();

    const response = await fetch(`${API_BASE_URL}/languages/primary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch primary language");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch primary language:", error);
    return null;
  }
}
