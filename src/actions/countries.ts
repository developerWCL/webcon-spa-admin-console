"use server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Get all Country from the API
 */
export interface Country {
  code: string;
  title: string;
}
export async function getCountries(): Promise<Country[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/country`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
    return [];
  }
}
