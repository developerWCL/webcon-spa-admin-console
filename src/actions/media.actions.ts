"use server";

import { auth } from "@/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function generateMediaUploadUrls(
  images: Array<{ filename: string; mimeType: string; size: number }>,
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      throw new Error("Unauthorized");
    }

    const response = await fetch(`${API_BASE_URL}/medias/upload-urls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify({ images }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        errorData.error ||
        "Failed to generate upload URLs";
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Generate media upload URLs error:", error);
    throw error;
  }
}

export async function uploadImageToS3(
  presignedUrl: string,
  fileData: ArrayBuffer,
  mimeType: string,
): Promise<void> {
  try {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
      },
      body: fileData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image to S3: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Upload to S3 error:", error);
    throw error;
  }
}
