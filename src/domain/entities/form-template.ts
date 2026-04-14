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
    email?: string | null;
    phone?: string | null;
    contact?: string | null;
    role?: string | null;
    notes?: string | null;
    mediaUrl?: string | null;
    mediaPublicId?: string | null;
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
