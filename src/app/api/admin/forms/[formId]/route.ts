import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoFormTemplateRepository } from "@/data/repositories/mongo-form-template-repository";
import { ManageFormsUseCase } from "@/domain/use-cases/admin/manage-forms";
import { updateFormTemplateSchema } from "@/lib/validations";

const repo = new MongoFormTemplateRepository();
const useCase = new ManageFormsUseCase(repo);

interface RouteParams {
  params: Promise<{ formId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { formId } = await params;
    const form = await useCase.getForm(formId);
    if (!form) {
      return NextResponse.json({ success: false, error: "Form not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: form });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch form" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { formId } = await params;
    const body = await request.json();
    const parsed = updateFormTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const form = await useCase.updateForm(formId, parsed.data);
    if (!form) {
      return NextResponse.json({ success: false, error: "Form not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: form });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update form" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { formId } = await params;
    const result = await useCase.deleteForm(formId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, message: "Form deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete form" }, { status: 500 });
  }
}
