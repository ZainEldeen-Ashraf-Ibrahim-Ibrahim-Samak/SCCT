import { SubmissionRepository } from "@/domain/repositories/submission-repository";
import { FieldValueRepository } from "@/domain/repositories/field-value-repository";
import { FormTemplateRepository } from "@/domain/repositories/form-template-repository";
import { FieldDefinitionRepository } from "@/domain/repositories/field-definition-repository";
import { Submission } from "@/domain/entities/submission";
import { FieldValue } from "@/domain/entities/field-value";
import { FormTemplate } from "@/domain/entities/form-template";
import { FieldDefinition } from "@/domain/entities/field-definition";

interface ViewSubmissionResult {
  isNew: boolean;
  formTemplate?: FormTemplate;
  fields?: FieldDefinition[];
  submission?: Submission;
  values?: FieldValue[];
}

/**
 * Use case for a client viewing a submission link (US2).
 * If the token isn't a submission yet, we render the active form.
 * If it is, we return the submission status and data.
 */
export class ViewSubmissionUseCase {
  constructor(
    private submissionRepo: SubmissionRepository,
    private fieldValueRepo: FieldValueRepository,
    private formTemplateRepo: FormTemplateRepository,
    private fieldDefRepo: FieldDefinitionRepository
  ) {}

  async execute(tokenOrId: string): Promise<ViewSubmissionResult | null> {
    // 1. Try to find an existing submission by token
    // (We also check ID here if admin is viewing it directly, though ViewSubmission is mainly client)
    let submission = await this.submissionRepo.findByToken(tokenOrId);
    if (!submission) {
      try {
         submission = await this.submissionRepo.findById(tokenOrId);
      } catch {
         // ignore invalid ID format
      }
    }

    if (submission) {
      // Existing submission — fetch its saved values
      const values = await this.fieldValueRepo.findBySubmissionId(submission.id);
      return {
        isNew: false,
        submission,
        values,
        fields: [...submission.formSnapshot], // The fields as they were at submission time
      };
    }

    // 2. Not found, but is it a UUID token for a *new* submission?
    // We expect the controller to pass a token. We return the fresh form.
    const activeForm = await this.formTemplateRepo.findActive();
    if (!activeForm) {
      return null; // No form to show
    }

    const fields = await this.fieldDefRepo.findByFormId(activeForm.id, false);

    return {
      isNew: true,
      formTemplate: activeForm,
      fields,
    };
  }
}
