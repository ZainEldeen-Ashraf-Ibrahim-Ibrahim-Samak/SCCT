import { NextResponse } from "next/server";
import { signUploadRequest } from "@/data/services/cloudinary-service";
import { badRequestResponse, errorResponse, successResponse } from "@/lib/api-response";
import { logger } from "@/lib/dev-logger";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { timestamp, folder, eager, public_id } = body;

    if (!timestamp) {
      return badRequestResponse("Timestamp is required");
    }

    const result = signUploadRequest({
      timestamp,
      folder: folder || "submissions",
      eager,
      public_id,
    });

    return successResponse(result);
  } catch (error) {
    logger.error("Failed to sign upload request", error);
    return errorResponse("Failed to sign upload request", 500, "SIGN_UPLOAD_FAILED");
  }
}
