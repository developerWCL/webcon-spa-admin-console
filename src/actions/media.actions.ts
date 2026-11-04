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
  fileData: ArrayBuffer | number[],
  mimeType: string,
): Promise<void> {
  try {
     // Convert to Uint8Array for proper fetch body handling
    let uint8Array: Uint8Array;

    if (fileData instanceof ArrayBuffer) {
      uint8Array = new Uint8Array(fileData);
    } else if (Array.isArray(fileData)) {
      uint8Array = new Uint8Array(fileData);
    } else {
      throw new Error("Invalid file data format");
    }

    console.log(`[uploadImageToS3] Uploading ${uint8Array.length} bytes to S3`);

    const response = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": uint8Array.length.toString(),
      },
      body: uint8Array,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `[uploadImageToS3] S3 upload failed: ${response.status} ${response.statusText}`,
        errorText,
      );
      throw new Error(
        `S3 upload failed: ${response.status} ${response.statusText}`,
      );
    }

    console.log("[uploadImageToS3] Upload successful");
  } catch (error) {
    console.error("[uploadImageToS3] Error:", error);
    throw error;
  }
}
