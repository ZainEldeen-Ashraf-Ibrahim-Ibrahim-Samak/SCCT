import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoFieldDefinitionRepository } from "@/data/repositories/mongo-field-definition-repository";
import { ManageFieldsUseCase } from "@/domain/use-cases/admin/manage-fields";
import { createFieldDefinitionSchema } from "@/lib/validations";

const repo = new MongoFieldDefinitionRepository();
const useCase = new ManageFieldsUseCase(repo);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const formTemplateId = searchParams.get("formTemplateId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    if (!formTemplateId) {
      return NextResponse.json(
        { success: false, error: "formTemplateId is required" },
        { status: 400 }
      );
    }

    const fields = await useCase.listFields(formTemplateId, includeInactive);
    return NextResponse.json({ success: true, data: fields });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch fields" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createFieldDefinitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const field = await useCase.createField(parsed.data);
    return NextResponse.json({ success: true, data: field }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create field" }, { status: 500 });
  }
}
