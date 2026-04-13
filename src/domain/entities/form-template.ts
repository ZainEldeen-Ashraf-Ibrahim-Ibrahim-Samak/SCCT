/**
 * FormTemplate entity interface.
 * Domain layer — zero framework imports.
 */
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateFormTemplateInput = Pick<FormTemplate, "name"> & {
  description?: string;
};

export type UpdateFormTemplateInput = Partial<
  Pick<FormTemplate, "name" | "description" | "isActive">
>;
