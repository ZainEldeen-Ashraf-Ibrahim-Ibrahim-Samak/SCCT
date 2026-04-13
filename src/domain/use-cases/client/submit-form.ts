import { SubmissionRepository } from "@/domain/repositories/submission-repository";
import { FieldValueRepository } from "@/domain/repositories/field-value-repository";
import { FormTemplateRepository } from "@/domain/repositories/form-template-repository";
import { FieldDefinitionRepository } from "@/domain/repositories/field-definition-repository";
import { Submission } from "@/domain/entities/submission";
import { generateAccessToken } from "@/lib/utils";
import { NotificationPublisher } from "@/lib/events/publisher";

interface SubmitFormData {
  clientName: string;
  clientContact?: string;
  fieldValues: Array<{
    fieldDefinitionId: string;
    value?: string | number | null;
    mediaUrl?: string | null;
    mediaPublicId?: string | null;
    mediaItems?: Array<{ url: string; publicId: string }>;
  }>;
}

/**
 * Use case for client form submission (P1).
 * Validates fields against the currently active form and creates the submission + field values.
 */
export class SubmitFormUseCase {
  constructor(
    private submissionRepo: SubmissionRepository,
    private fieldValueRepo: FieldValueRepository,
    private formTemplateRepo: FormTemplateRepository,
    private fieldDefRepo: FieldDefinitionRepository
  ) {}

  async execute(data: SubmitFormData): Promise<{ success: boolean; submission?: Submission; error?: string }> {
    const activeForm = await this.formTemplateRepo.findActive();
    if (!activeForm) {
      return { success: false, error: "No active form template found" };
    }

    const activeFields = await this.fieldDefRepo.findByFormId(activeForm.id, false);
    if (activeFields.length === 0) {
      return { success: false, error: "Active form has no fields" };
    }

    // 1. Validate required fields
    for (const field of activeFields) {
      if (field.validationRules?.required) {
        const submittedValue = data.fieldValues.find((v) => v.fieldDefinitionId === field.id);
        const hasMedia = submittedValue?.mediaUrl && submittedValue.mediaUrl.trim().length > 0;
        const hasMediaItems = submittedValue?.mediaItems && submittedValue.mediaItems.length > 0;
        const hasTextValue =
          submittedValue?.value !== undefined &&
          submittedValue?.value !== null &&
          submittedValue.value.toString().trim().length > 0;

        if (!hasMedia && !hasTextValue && !hasMediaItems) {
          return { success: false, error: `Field '${field.nameEn}' is required` };
        }
      }
    }

    // 2. Create Submission with form snapshot
    const token = generateAccessToken();
    const submission = await this.submissionRepo.create(
      {
        formTemplateId: activeForm.id,
        clientName: data.clientName,
        clientContact: data.clientContact || "",
        formSnapshot: activeFields,
      },
      token
    );

    // 3. Extract and map Field Values
    const fieldValuesToCreate = data.fieldValues
      .map((fv) => {
        const def = activeFields.find((f) => f.id === fv.fieldDefinitionId);
        if (!def) return null; // Ignore extra fields

        return {
          submissionId: submission.id,
          fieldDefinitionId: def.id,
          fieldNameSnapshot: def.nameEn, // Defaulting to English snapshot, display maps appropriately
          fieldTypeSnapshot: def.inputType,
          value: fv.value ?? null,
          mediaUrl: fv.mediaUrl ?? null,
          mediaPublicId: fv.mediaPublicId ?? null,
          mediaItems: fv.mediaItems ?? [],
        };
      })
      .filter(Boolean) as any[];

    if (fieldValuesToCreate.length > 0) {
      await this.fieldValueRepo.createMany(fieldValuesToCreate);
    }

    // Fire & forget notification
    NotificationPublisher.notifyAdmins({
      type: "NEW_SUBMISSION",
      title: "New Submission",
      message: `${data.clientName} just submitted a new response.`,
      link: `/admin/submissions?expand=${submission.id}`
    });

    return { success: true, submission };
  }

  async resubmit(accessToken: string, data: SubmitFormData): Promise<{ success: boolean; submission?: Submission; error?: string }> {
    const submission = await this.submissionRepo.findByToken(accessToken);
    if (!submission) {
      return { success: false, error: "Submission not found" };
    }

    if (submission.status !== "needs_rewrite") {
      return { success: false, error: "Only submissions marked 'Needs Rewrite' can be resubmitted" };
    }

    // 1. Validate against the snapshot
    for (const field of submission.formSnapshot) {
      if (field.validationRules?.required) {
        const submittedValue = data.fieldValues.find((v) => v.fieldDefinitionId === field.id);
        const hasMedia = submittedValue?.mediaUrl && submittedValue.mediaUrl.trim().length > 0;
        const hasMediaItems = submittedValue?.mediaItems && submittedValue.mediaItems.length > 0;
        const hasTextValue =
          submittedValue?.value !== undefined &&
          submittedValue?.value !== null &&
          submittedValue.value.toString().trim().length > 0;

        if (!hasMedia && !hasTextValue && !hasMediaItems) {
          return { success: false, error: `Field '${field.nameEn}' is required` };
        }
      }
    }

    // 2. Update Field Values
    const updates = data.fieldValues.map((fv) => ({
      fieldDefinitionId: fv.fieldDefinitionId,
      data: {
        value: fv.value ?? null,
        mediaUrl: fv.mediaUrl ?? null,
        mediaPublicId: fv.mediaPublicId ?? null,
        mediaItems: fv.mediaItems ?? [],
      },
    }));

    await this.fieldValueRepo.updateMany(submission.id, updates);

    // 3. Reset submission status to pending
    const updatedSubmission = await this.submissionRepo.resetStatusForResubmission(submission.id);

    // Fire & forget notification
    NotificationPublisher.notifyAdmins({
      type: "NEW_SUBMISSION",
      title: "Submission Corrected",
      message: `${data.clientName} has corrected their rejected submission.`,
      link: `/admin/submissions?expand=${submission.id}`
    });

    return { success: true, submission: updatedSubmission || submission };
  }
}
