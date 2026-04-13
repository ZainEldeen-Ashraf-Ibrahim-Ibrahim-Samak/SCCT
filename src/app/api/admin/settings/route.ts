import { NextResponse } from "next/server";
import { ManageSettingsUseCase } from "@/domain/use-cases/admin/manage-settings";
import { auth } from "@/lib/auth"; // Assume auth check

const useCase = new ManageSettingsUseCase();

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await useCase.getSettings();
    return NextResponse.json({ success: true, data: settings || {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updaterId = session.user.id || "admin";

    const updated = await useCase.updateSettings(updaterId, {
      backup: body.backup,
      cron: body.cron,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
