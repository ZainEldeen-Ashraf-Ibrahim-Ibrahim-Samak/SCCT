import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoSubmissionRepository } from "@/data/repositories/mongo-submission-repository";

const repo = new MongoSubmissionRepository();

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const status = searchParams.get("status") || "all";
    const limit = 10;

    const result = await repo.listPaginated(page, limit, status);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
