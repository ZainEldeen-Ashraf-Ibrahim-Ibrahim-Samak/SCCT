import { auth } from "@/lib/auth";
import { MongoFieldDefinitionRepository } from "@/data/repositories/mongo-field-definition-repository";
import { ManageFieldsUseCase } from "@/domain/use-cases/admin/manage-fields";
import { reorderFieldsSchema } from "@/lib/validations";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import { logger } from "@/lib/dev-logger";
import { CacheService } from "@/data/services/cache-service";

const repo = new MongoFieldDefinitionRepository();
const useCase = new ManageFieldsUseCase(repo);

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const parsed = reorderFieldsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, "VALIDATION_FAILED", parsed.error.flatten());
    }

    await useCase.reorderFields(parsed.data.formTemplateId, parsed.data.fieldOrder);
    await CacheService.invalidateAllSubmissionPayloadCache();
    return successResponse({ message: "Field order updated" });
  } catch (error) {
    logger.error("Failed to reorder fields", error);
    return errorResponse("Failed to reorder fields", 500, "FIELDS_REORDER_FAILED");
  }
}
