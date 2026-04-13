import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoSubmissionRepository } from "@/data/repositories/mongo-submission-repository";

const repo = new MongoSubmissionRepository();

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const counts = await repo.getCounts();
    return NextResponse.json({ success: true, data: counts });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
