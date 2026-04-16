import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env.mjs";
import { logger } from "@/lib/dev-logger";

// Configure Cloudinary
if (env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface SignUploadParams {
  timestamp: number;
  folder?: string;
  eager?: string;
  public_id?: string;
  upload_preset?: string;
}

export interface SignUploadResult {
  signature: string;
  timestamp: number;
  cloudname: string;
  apikey: string;
}

/**
 * Sign an upload request for Cloudinary.
 */
export function signUploadRequest(params: SignUploadParams): SignUploadResult {
  const timestamp = params.timestamp || Math.round(new Date().getTime() / 1000);
  const apiSecret = env.CLOUDINARY_API_SECRET;
  
  // Sanitize params to remove undefined/null values which break signature verification
  const cleanParams: Record<string, any> = { timestamp };
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && String(val).trim().length > 0) {
      if (key !== "timestamp") { // Timestamp already handled
         cleanParams[key] = val;
      }
    }
  }

  if (!apiSecret) {
    logger.error("CLOUDINARY_API_SECRET is missing from environment variables");
    throw new Error("Cloudinary configuration incomplete: API Secret missing");
  }

  const signature = cloudinary.utils.api_sign_request(
    cleanParams,
    apiSecret
  );

  return {
    signature,
    timestamp,
    cloudname: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
    apikey: env.CLOUDINARY_API_KEY || "",
  };
}

/**
 * Destroy an asset on Cloudinary.
 */
export async function destroyAsset(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image"
): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    logger.error(`Cloudinary destroy failed: ${publicId}`, error);
    return { result: "failed" };
  }
}

/**
 * Destroy multiple assets on Cloudinary.
 */
export async function destroyAssets(
  publicIds: string[],
  resourceType: "image" | "raw" | "video" = "image"
): Promise<void> {
  if (publicIds.length === 0) return;
  
  try {
    // Note: delete_resources only works for images by default or needs resource_type specified
    await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    });
  } catch (error) {
    logger.error("Cloudinary bulk delete failed", { publicIds, error });
  }
}

/**
 * Get a transformed URL.
 */
export function getTransformUrl(
  publicId: string,
  options: any = {}
): string {
  if (publicId.startsWith("http")) return publicId;
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
}

/**
 * Get a thumbnail URL.
 */
export function getThumbnailUrl(publicId: string): string {
  if (publicId.startsWith("http")) return publicId;
  return cloudinary.url(publicId, {
    secure: true,
    width: 250,
    height: 250,
    crop: "thumb",
    gravity: "face",
  });
}
