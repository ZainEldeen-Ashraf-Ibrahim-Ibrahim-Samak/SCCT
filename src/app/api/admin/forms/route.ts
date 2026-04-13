import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoFormTemplateRepository } from "@/data/repositories/mongo-form-template-repository";
import { ManageFormsUseCase } from "@/domain/use-cases/admin/manage-forms";
import { createFormTemplateSchema } from "@/lib/validations";

const repo = new MongoFormTemplateRepository();
const useCase = new ManageFormsUseCase(repo);

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const forms = await useCase.listForms();
    return NextResponse.json({ success: true, data: forms });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch forms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createFormTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const form = await useCase.createForm(parsed.data);
    return NextResponse.json({ success: true, data: form }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create form" }, { status: 500 });
  }
}
