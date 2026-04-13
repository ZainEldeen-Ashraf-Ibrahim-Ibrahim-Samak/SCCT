import { auth } from "@/lib/auth";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import { logger } from "@/lib/dev-logger";
import { generateAccessToken } from "@/lib/utils";
import { MongoSubmissionRepository } from "@/data/repositories/mongo-submission-repository";
import { MongoFormTemplateRepository } from "@/data/repositories/mongo-form-template-repository";
import { MongoFieldDefinitionRepository } from "@/data/repositories/mongo-field-definition-repository";

const submissionRepo = new MongoSubmissionRepository();
const formTemplateRepo = new MongoFormTemplateRepository();
const fieldDefRepo = new MongoFieldDefinitionRepository();

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  try {
    const { formId } = await params;
    
    // Validate form exists
    const form = await formTemplateRepo.findById(formId);
    if (!form) {
      return errorResponse("Form not found", 404, "NOT_FOUND");
    }

    const fields = await fieldDefRepo.findByFormId(formId, false);

    // Create a new empty submission to generate an invite token, marked as draft
    const token = generateAccessToken();
    const submission = await submissionRepo.create({
      formTemplateId: formId,
      clientName: "Pending Submission", // Placeholder
      clientContact: "",
      formSnapshot: fields,
    }, token);

    await submissionRepo.updateStatus(submission.id, {
      status: "draft",
      comment: "",
      admin: {
        id: session.user.id,
        name: session.user.name || "Admin",
      }
    });

    return successResponse({ token });
  } catch (error) {
    logger.error("Failed to provision form token", error);
    return errorResponse("Server error", 500, "TOKEN_PROVISION_FAILED");
  }
}
