import { NextResponse } from "next/server";
import { signUploadRequest } from "@/data/services/cloudinary-service";
import { auth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { logger } from "@/lib/dev-logger";

export async function POST(request: Request) {
  // Optional: restrict to authenticated users if needed, 
  // but public submissions might need signatures too if they upload directly to Cloudinary.
  // For now, let's keep it accessible if authenticated OR if we trust the referral.
  
  try {
    const params = await request.json();
    const result = signUploadRequest(params);
    return successResponse(result);
  } catch (error) {
    logger.error("Failed to sign Cloudinary request", error);
    return errorResponse("Signature failed", 500);
  }
}
