import { MongoSubmissionRepository } from "@/data/repositories/mongo-submission-repository";
import { MongoFieldValueRepository } from "@/data/repositories/mongo-field-value-repository";
import { MongoFormTemplateRepository } from "@/data/repositories/mongo-form-template-repository";
import { MongoFieldDefinitionRepository } from "@/data/repositories/mongo-field-definition-repository";
import { createSubmissionSchema } from "@/lib/validations";
import { SubmitFormUseCase, ViewSubmissionUseCase } from "@/domain/use-cases/client";
import { errorResponse, successResponse } from "@/lib/api-response";
import { logger } from "@/lib/dev-logger";
import { NotificationPublisher } from "@/lib/events/publisher";

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

export const dynamic = "force-dynamic";

function summarizeFieldValues(
  fieldValues: Array<{
    fieldDefinitionId: string;
    value?: string | number | null;
    mediaUrl?: string | null;
    mediaItems?: Array<{ url: string; publicId: string }>;
  }>,
) {
  return {
    total: fieldValues.length,
    withText: fieldValues.filter(
      (fv) => fv.value !== null && fv.value !== undefined && String(fv.value).trim().length > 0,
    ).length,
    withMediaUrl: fieldValues.filter((fv) => !!fv.mediaUrl).length,
    withMediaItems: fieldValues.filter((fv) => (fv.mediaItems?.length ?? 0) > 0).length,
    ids: fieldValues.map((fv) => fv.fieldDefinitionId),
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const result = await viewUseCase.execute(token);

    if (!result) {
      return errorResponse("Not found", 404, "NOT_FOUND");
    }

    return successResponse(result);
  } catch (error) {
    logger.error("Failed to fetch submission by token", { error, url: request.url });
    return errorResponse("Server error", 500, "SUBMISSION_FETCH_FAILED");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const parsed = createSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn("Submission validation failed", {
        token,
        issues: parsed.error.flatten(),
      });
      return errorResponse("Validation error", 400, "VALIDATION_ERROR", parsed.error.flatten());
    }

    logger.info("Submission POST accepted", {
      token,
      clientNameLength: parsed.data.clientName.length,
      clientContactLength: parsed.data.clientContact?.length ?? 0,
      fieldSummary: summarizeFieldValues(parsed.data.fieldValues),
    });

    const result = await submitUseCase.execute({
      clientName: parsed.data.clientName,
      clientContact: parsed.data.clientContact,
      fieldValues: parsed.data.fieldValues,
    }, {
      tokenOrFormId: token,
    });

    if (!result.success || !result.submission) {
      logger.warn("Submission POST rejected by use-case", {
        token,
        reason: result.error ?? "Unknown",
      });
      return errorResponse(result.error ?? "Invalid submission", 400, "SUBMISSION_INVALID");
    }

    logger.info("Submission POST persisted", {
      token,
      submissionId: result.submission.id,
      accessToken: result.submission.accessToken,
    });

    // Notify admins
    await NotificationPublisher.notifyAdmins({
      type: "NEW_SUBMISSION",
      title: "New Submission",
      message: `${parsed.data.clientName} has submitted a new form.`,
      link: `/admin/submissions/${result.submission.id}`
    });

    return successResponse(result.submission, 201);
  } catch (error) {
    logger.error("Failed to submit form", error);
    return errorResponse("Server error", 500, "SUBMISSION_CREATE_FAILED");
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const parsed = createSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn("Resubmission validation failed", {
        token,
        issues: parsed.error.flatten(),
      });
      return errorResponse("Validation error", 400, "VALIDATION_ERROR", parsed.error.flatten());
    }

    logger.info("Submission PATCH accepted", {
      token,
      clientNameLength: parsed.data.clientName.length,
      clientContactLength: parsed.data.clientContact?.length ?? 0,
      fieldSummary: summarizeFieldValues(parsed.data.fieldValues),
    });

    const result = await submitUseCase.resubmit(token, {
      clientName: parsed.data.clientName,
      clientContact: parsed.data.clientContact,
      fieldValues: parsed.data.fieldValues,
    });

    if (!result.success || !result.submission) {
      logger.warn("Submission PATCH rejected by use-case", {
        token,
        reason: result.error ?? "Unknown",
      });
      return errorResponse(result.error ?? "Invalid resubmission", 400, "RESUBMISSION_INVALID");
    }

    logger.info("Submission PATCH persisted", {
      token,
      submissionId: result.submission.id,
    });

    // Notify admins
    await NotificationPublisher.notifyAdmins({
      type: "NEW_SUBMISSION",
      title: "Form Resubmitted",
      message: `${parsed.data.clientName} has updated their submission.`,
      link: `/admin/submissions/${result.submission.id}`
    });

    return successResponse(result.submission);
  } catch (error) {
    logger.error("Failed to resubmit form", error);
    return errorResponse("Server error", 500, "SUBMISSION_RESUBMIT_FAILED");
  }
}
