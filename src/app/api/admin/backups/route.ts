import { NextResponse } from "next/server";
import { ExecuteBackupUseCase } from "@/domain/use-cases/admin/execute-backup";
import { auth } from "@/lib/auth";

const useCase = new ExecuteBackupUseCase();

// Support POST for manual trigger
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await useCase.execute("manual");
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Support GET for Vercel Cron (Secured by vercel cron token or manual auth bypass logic on Vercel)
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized cron" }, { status: 401 });
    }

    const result = await useCase.execute("cron");
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Optionally, this same endpoint (or a different one like /api/cron/backup) can be hit by Vercel Cron
// For now, we support triggering backup manually through standard admin authenticated requests.
