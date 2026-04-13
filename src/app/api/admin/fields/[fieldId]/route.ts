import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoFieldDefinitionRepository } from "@/data/repositories/mongo-field-definition-repository";
import { ManageFieldsUseCase } from "@/domain/use-cases/admin/manage-fields";
import { updateFieldDefinitionSchema } from "@/lib/validations";

const repo = new MongoFieldDefinitionRepository();
const useCase = new ManageFieldsUseCase(repo);

interface RouteParams {
  params: Promise<{ fieldId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fieldId } = await params;
    const body = await request.json();
    const parsed = updateFieldDefinitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const field = await useCase.updateField(fieldId, parsed.data);
    if (!field) {
      return NextResponse.json({ success: false, error: "Field not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: field });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update field" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fieldId } = await params;
    const deleted = await useCase.deleteField(fieldId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Field not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Field deactivated successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete field" }, { status: 500 });
  }
}
