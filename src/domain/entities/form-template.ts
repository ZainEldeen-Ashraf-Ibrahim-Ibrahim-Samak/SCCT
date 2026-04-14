/**
 * FormTemplate entity interface.
 * Domain layer — zero framework imports.
 */
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  contactRecords: Array<{
    id: string;
    name: string;
    contact?: string;
    role?: string;
    notes?: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateFormTemplateInput = Pick<FormTemplate, "name"> & {
  description?: string;
};

export type UpdateFormTemplateInput = Partial<
  Pick<FormTemplate, "name" | "description" | "isActive" | "contactRecords">
>;
