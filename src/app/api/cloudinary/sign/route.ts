import { NextResponse } from "next/server";
import { signUploadRequest } from "@/data/services/cloudinary-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { timestamp, folder, eager, public_id } = body;

    if (!timestamp) {
      return NextResponse.json(
        { success: false, error: "Timestamp is required" },
        { status: 400 }
      );
    }

    const result = signUploadRequest({
      timestamp,
      folder: folder || "submissions",
      eager,
      public_id,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to sign upload request" },
      { status: 500 }
    );
  }
}
