import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoFieldDefinitionRepository } from "@/data/repositories/mongo-field-definition-repository";
import { ManageFieldsUseCase } from "@/domain/use-cases/admin/manage-fields";
import { reorderFieldsSchema } from "@/lib/validations";

const repo = new MongoFieldDefinitionRepository();
const useCase = new ManageFieldsUseCase(repo);

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = reorderFieldsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await useCase.reorderFields(parsed.data.formTemplateId, parsed.data.fieldOrder);
    return NextResponse.json({ success: true, message: "Field order updated" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to reorder fields" }, { status: 500 });
  }
}
