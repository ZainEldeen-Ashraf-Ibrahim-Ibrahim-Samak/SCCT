import { NextResponse } from "next/server";
import { MongoSubmissionRepository } from "@/data/repositories/mongo-submission-repository";
import { MongoFieldValueRepository } from "@/data/repositories/mongo-field-value-repository";
import { MongoFormTemplateRepository } from "@/data/repositories/mongo-form-template-repository";
import { MongoFieldDefinitionRepository } from "@/data/repositories/mongo-field-definition-repository";
import { createSubmissionSchema } from "@/lib/validations";
import { SubmitFormUseCase, ViewSubmissionUseCase } from "@/domain/use-cases/client";

const submissionRepo = new MongoSubmissionRepository();
const fieldValueRepo = new MongoFieldValueRepository();
const formTemplateRepo = new MongoFormTemplateRepository();
const fieldDefRepo = new MongoFieldDefinitionRepository();

const submitUseCase = new SubmitFormUseCase(
  submissionRepo,
  fieldValueRepo,
  formTemplateRepo,
  fieldDefRepo
);
const viewUseCase = new ViewSubmissionUseCase(
  submissionRepo,
  fieldValueRepo,
  formTemplateRepo,
  fieldDefRepo
);

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const result = await viewUseCase.execute(token);

    if (!result) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await submitUseCase.execute({
      clientName: parsed.data.clientName,
      clientContact: parsed.data.clientContact,
      fieldValues: parsed.data.fieldValues,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.submission }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const parsed = createSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await submitUseCase.resubmit(token, {
      clientName: parsed.data.clientName,
      clientContact: parsed.data.clientContact,
      fieldValues: parsed.data.fieldValues,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.submission });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
