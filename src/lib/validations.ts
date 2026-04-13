import { z } from "zod";

// ── Enums ──────────────────────────────────────────────────────────

export const InputTypeEnum = z.enum([
  "text",
  "number",
  "image",
  "file",
  "date",
  "dropdown",
]);
export type InputType = z.infer<typeof InputTypeEnum>;

export const SubmissionStatusEnum = z.enum([
  "pending",
  "viewed",
  "needs_rewrite",
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusEnum>;

export const LocaleEnum = z.enum(["en", "ar"]);
export type Locale = z.infer<typeof LocaleEnum>;

export const ThemeEnum = z.enum(["light", "dark"]);
export type Theme = z.infer<typeof ThemeEnum>;

// ── Validation Rules Schema ────────────────────────────────────────

export const validationRulesSchema = z
  .object({
    required: z.boolean().default(false),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(1).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    maxFileSize: z.number().int().min(1).default(10485760), // 10 MB
    allowedFileTypes: z.array(z.string()).optional(),
  })
  .partial();

// ── Field Definition Schemas ───────────────────────────────────────

export const createFieldDefinitionSchema = z
  .object({
    formTemplateId: z.string().min(1, "Form template ID is required"),
    nameEn: z.string().min(1).max(200, "Name must be 200 characters or fewer"),
    nameAr: z
      .string()
      .min(1)
      .max(200, "Arabic name must be 200 characters or fewer"),
    inputType: InputTypeEnum,
    isMultiple: z.boolean().optional().default(false),
    validationRules: validationRulesSchema.optional().default({}),
    dropdownOptionsEn: z.array(z.string()).optional().default([]),
    dropdownOptionsAr: z.array(z.string()).optional().default([]),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.inputType === "dropdown") {
        return (
          data.dropdownOptionsEn.length > 0 &&
          data.dropdownOptionsAr.length > 0
        );
      }
      return true;
    },
    {
      message:
        "Dropdown options in both languages are required for dropdown fields",
      path: ["dropdownOptionsEn"],
    }
  )
  .refine(
    (data) => {
      if (data.inputType === "dropdown") {
        return data.dropdownOptionsEn.length === data.dropdownOptionsAr.length;
      }
      return true;
    },
    {
      message:
        "English and Arabic dropdown options must have the same number of items",
      path: ["dropdownOptionsAr"],
    }
  );

export const updateFieldDefinitionSchema = z.object({
  nameEn: z.string().min(1).max(200).optional(),
  nameAr: z.string().min(1).max(200).optional(),
  inputType: InputTypeEnum.optional(),
  isMultiple: z.boolean().optional(),
  validationRules: validationRulesSchema.optional(),
  dropdownOptionsEn: z.array(z.string()).optional(),
  dropdownOptionsAr: z.array(z.string()).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const reorderFieldsSchema = z.object({
  formTemplateId: z.string().min(1),
  fieldOrder: z.array(
    z.object({
      fieldId: z.string().min(1),
      sortOrder: z.number().int().min(0),
    })
  ),
});

// ── Form Template Schemas ──────────────────────────────────────────

export const createFormTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or fewer"),
  description: z.string().optional().default(""),
});

export const updateFormTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ── Submission Schemas ─────────────────────────────────────────────

export const fieldValueInputSchema = z.object({
  fieldDefinitionId: z.string().min(1),
  value: z
    .union([z.string(), z.number(), z.array(z.string()), z.null()])
    .optional(),
  mediaUrl: z.string().optional().nullable(),
  mediaPublicId: z.string().optional().nullable(),
  mediaItems: z.array(z.object({
    url: z.string(),
    publicId: z.string()
  })).optional(),
});

export const contactRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  contact: z.string().max(200).optional().default(""),
  role: z.string().max(100).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
});

export const createSubmissionSchema = z.object({
  clientName: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or fewer"),
  clientContact: z.string().optional().default(""),
  contactRecords: z
    .array(contactRecordSchema)
    .min(1, "At least one contact record is required"),
  fieldValues: z.array(fieldValueInputSchema),
});

export const updateSubmissionStatusSchema = z
  .object({
    status: SubmissionStatusEnum,
    comment: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "needs_rewrite") {
        return data.comment && data.comment.trim().length > 0;
      }
      return true;
    },
    {
      message: "Comment is required when marking as Needs Rewrite",
      path: ["comment"],
    }
  );

// ── Preferences Schema ────────────────────────────────────────────

export const updatePreferencesSchema = z.object({
  languagePreference: LocaleEnum.optional(),
  themePreference: ThemeEnum.optional(),
});

// ── Auth Schemas ───────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
