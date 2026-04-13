/**
 * FieldDefinition entity interface.
 * Domain layer — zero framework imports.
 */

export type InputType = "text" | "number" | "image" | "file" | "date" | "dropdown";

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export interface FieldDefinition {
  id: string;
  formTemplateId: string;
  nameEn: string;
  nameAr: string;
  inputType: InputType;
  validationRules: ValidationRules;
  dropdownOptionsEn: string[];
  dropdownOptionsAr: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateFieldDefinitionInput = Omit<
  FieldDefinition,
  "id" | "isActive" | "createdAt" | "updatedAt"
> & {
  sortOrder?: number;
};

export type UpdateFieldDefinitionInput = Partial<
  Pick<
    FieldDefinition,
    | "nameEn"
    | "nameAr"
    | "inputType"
    | "validationRules"
    | "dropdownOptionsEn"
    | "dropdownOptionsAr"
    | "sortOrder"
  >
>;

export interface ReorderFieldInput {
  fieldId: string;
  sortOrder: number;
}
