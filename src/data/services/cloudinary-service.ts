import { unlink } from "fs/promises";
import path from "path";

/**
 * Local file storage service replacing Cloudinary.
 * Handles deletion and URL generation for locally stored files in public/uploads.
 */

export interface SignUploadParams {
  timestamp: number;
  folder?: string;
  eager?: string;
  public_id?: string;
}

export interface SignUploadResult {
  signature: string;
  timestamp: number;
  cloudname: string;
  apikey: string;
}

/**
 * Placeholder for compatibility, no longer used with local uploads.
 */
export function signUploadRequest(params: SignUploadParams): SignUploadResult {
  return {
    signature: "local",
    timestamp: Date.now(),
    cloudname: "local",
    apikey: "local",
  };
}

/**
 * Destroy a local file by its public ID (filename).
 */
export async function destroyAsset(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image"
): Promise<{ result: string }> {
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", publicId);
    await unlink(filePath);
    return { result: "ok" };
  } catch (error) {
    console.error(`Failed to delete local asset: ${publicId}`, error);
    return { result: "failed" };
  }
}

/**
 * Destroy multiple local files.
 */
export async function destroyAssets(
  publicIds: string[],
  resourceType: "image" | "raw" | "video" = "image"
): Promise<void> {
  if (publicIds.length === 0) return;

  await Promise.all(
    publicIds.map((id) => destroyAsset(id, resourceType))
  );
}

/**
 * Generate a local URL for the file.
 * Local files don't support dynamic transformations without a backend service.
 */
export function getTransformUrl(
  publicId: string,
  options: any = {}
): string {
  // If it's already a URL, return it
  if (publicId.startsWith("/") || publicId.startsWith("http")) {
    return publicId;
  }
  return `/uploads/${publicId}`;
}

/**
 * Generate a thumbnail URL for preview display.
 */
export function getThumbnailUrl(publicId: string): string {
  return getTransformUrl(publicId);
}
