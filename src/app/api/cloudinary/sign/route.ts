import { signUploadRequest, type SignUploadParams } from "@/data/services/cloudinary-service";
import { errorResponse, successResponse } from "@/lib/api-response";
import { logger } from "@/lib/dev-logger";
import { parseSecureJson } from "@/lib/api-security";
import { resolveSubmissionUploadPolicy } from "@/lib/cloudinary/upload-policy";

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

    const policy = resolveSubmissionUploadPolicy({
      formId: typeof raw.formId === "string" ? raw.formId : null,
      draftId: typeof raw.draftId === "string" ? raw.draftId : null,
      fieldType: typeof raw.fieldType === "string" ? raw.fieldType : null,
      folder: typeof raw.folder === "string" ? raw.folder : null,
      eager: typeof raw.eager === "string" ? raw.eager : null,
    });

    const params: SignUploadParams = {
      timestamp: Math.floor(timestamp),
      folder: policy.folder,
      ...(policy.eager ? { eager: policy.eager } : {}),
      ...(typeof raw.public_id === "string" ? { public_id: raw.public_id } : {}),
      ...(policy.uploadPreset ? { upload_preset: policy.uploadPreset } : {}),
    };

    const result = signUploadRequest(params);
    return successResponse({
      ...result,
      folder: policy.folder,
      eager: policy.eager ?? null,
      uploadPreset: policy.uploadPreset ?? null,
      resourceType: policy.resourceType,
      upload_preset: policy.uploadPreset ?? null,
      resource_type: policy.resourceType,
    });
  } catch (error) {
    logger.error("Failed to sign Cloudinary request", error);
    return errorResponse("Signature failed", 500);
  }
}
