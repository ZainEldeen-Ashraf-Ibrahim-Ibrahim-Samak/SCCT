import { NextResponse } from "next/server";
import { signUploadRequest, type SignUploadParams } from "@/data/services/cloudinary-service";
import { errorResponse, successResponse } from "@/lib/api-response";
import { logger } from "@/lib/dev-logger";
import { parseSecureJson } from "@/lib/api-security";

export async function POST(request: Request) {
  // Optional: restrict to authenticated users if needed, 
  // but public submissions might need signatures too if they upload directly to Cloudinary.
  // For now, let's keep it accessible if authenticated OR if we trust the referral.
  
  try {
    const parsedBody = await parseSecureJson<Record<string, unknown>>(request);
    if (!parsedBody.success) {
      return errorResponse(parsedBody.error, 400, parsedBody.code);
    }

    const raw = parsedBody.data;
    const timestamp = Number(raw.timestamp);

    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      return errorResponse("timestamp is required", 400, "BAD_REQUEST");
    }

    const params: SignUploadParams = {
      timestamp: Math.floor(timestamp),
      ...(typeof raw.folder === "string" ? { folder: raw.folder } : {}),
      ...(typeof raw.eager === "string" ? { eager: raw.eager } : {}),
      ...(typeof raw.public_id === "string" ? { public_id: raw.public_id } : {}),
    };

    const result = signUploadRequest(params);
    return successResponse(result);
  } catch (error) {
    logger.error("Failed to sign Cloudinary request", error);
    return errorResponse("Signature failed", 500);
  }
}
