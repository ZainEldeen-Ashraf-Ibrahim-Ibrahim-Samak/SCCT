import { auth } from "@/lib/auth";
import { MongoSubmissionRepository } from "@/data/repositories/mongo-submission-repository";
import { updateSubmissionStatusSchema } from "@/lib/validations";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import { logger } from "@/lib/dev-logger";

const repo = new MongoSubmissionRepository();

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSubmissionStatusSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation error", 400, "VALIDATION_ERROR", parsed.error.flatten());
    }

    const result = await repo.updateStatus(id, {
      status: parsed.data.status,
      comment: parsed.data.comment,
      admin: { id: session.user.id as string, name: session.user.name as string },
    });

    if (!result) {
      return errorResponse("Not found", 404, "NOT_FOUND");
    }

    return successResponse(result);
  } catch (error) {
    logger.error("Failed to update submission status", error);
    return errorResponse("Server error", 500, "SUBMISSION_STATUS_UPDATE_FAILED");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const success = await repo.delete(id);

    if (!success) {
      return errorResponse("Not found", 404, "NOT_FOUND");
    }

    return successResponse({ message: "Deleted" });
  } catch (error) {
    logger.error("Failed to delete submission", { error, url: request.url });
    return errorResponse("Server error", 500, "SUBMISSION_DELETE_FAILED");
  }
}
