import { ManageSettingsUseCase } from "@/domain/use-cases/admin/manage-settings";
import { auth } from "@/lib/auth"; // Assume auth check
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import { logger } from "@/lib/dev-logger";

const useCase = new ManageSettingsUseCase();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const settings = await useCase.getSettings();
    return successResponse(settings || {});
  } catch (error: unknown) {
    logger.error("Failed to fetch admin settings", error);
    const message = error instanceof Error ? error.message : "Failed to fetch settings";
    return errorResponse(message, 500, "SETTINGS_FETCH_FAILED");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const updaterId = session.user.id || "admin";

    const updated = await useCase.updateSettings(updaterId, {
      backup: body.backup,
      cron: body.cron,
    });

    return successResponse(updated);
  } catch (error: unknown) {
    logger.error("Failed to update admin settings", error);
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return errorResponse(message, 500, "SETTINGS_UPDATE_FAILED");
  }
}
