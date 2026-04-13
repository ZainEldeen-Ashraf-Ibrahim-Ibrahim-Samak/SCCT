import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env.mjs";

cloudinary.config({
  cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

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
 * Generate a Cloudinary upload signature for signed uploads.
 * Used by the CldUploadWidget on the client side.
 */
export function signUploadRequest(params: SignUploadParams): SignUploadResult {
  const { timestamp, folder, eager, public_id } = params;

  const paramsToSign: Record<string, string | number> = { timestamp };
  if (folder) paramsToSign.folder = folder;
  if (eager) paramsToSign.eager = eager;
  if (public_id) paramsToSign.public_id = public_id;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudname: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apikey: env.CLOUDINARY_API_KEY!,
  };
}

/**
 * Destroy a Cloudinary asset by its public ID.
 * Used when deleting submissions or replacing media on resubmission.
 */
export async function destroyAsset(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image"
): Promise<{ result: string }> {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}

/**
 * Destroy multiple Cloudinary assets.
 * Used when hard-deleting a submission with multiple media files.
 */
export async function destroyAssets(
  publicIds: string[],
  resourceType: "image" | "raw" | "video" = "image"
): Promise<void> {
  if (publicIds.length === 0) return;

  await Promise.all(
    publicIds.map((id) =>
      cloudinary.uploader.destroy(id, { resource_type: resourceType })
    )
  );
}

/**
 * Generate a Cloudinary transformation URL for image display.
 * Applies responsive sizing and format optimization.
 */
export function getTransformUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string {
  const {
    width = 800,
    height,
    crop = "limit",
    quality = "auto",
    format = "auto",
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      {
        width,
        height,
        crop,
        quality,
        fetch_format: format,
      },
    ],
    secure: true,
  });
}

/**
 * Generate a thumbnail URL for preview display.
 */
export function getThumbnailUrl(publicId: string): string {
  return getTransformUrl(publicId, {
    width: 200,
    height: 200,
    crop: "fill",
  });
}
