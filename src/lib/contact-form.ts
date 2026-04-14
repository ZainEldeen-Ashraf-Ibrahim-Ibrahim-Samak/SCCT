import type { ContactFormField, ContactFormFieldKey } from "@/domain/entities/form-template";

export const CONTACT_FORM_FIELD_KEYS: ContactFormFieldKey[] = [
  "name",
  "email",
  "phone",
  "address",
];

const DEFAULT_LABELS: Record<ContactFormFieldKey, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  address: "Address",
};

const DEFAULT_PLACEHOLDERS: Record<ContactFormFieldKey, string> = {
  name: "Enter name",
  email: "Enter email",
  phone: "Enter phone",
  address: "Enter address",
};

function isContactFieldKey(value: unknown): value is ContactFormFieldKey {
  return typeof value === "string" && CONTACT_FORM_FIELD_KEYS.includes(value as ContactFormFieldKey);
}

export function createContactFormFieldConfig(
  key: ContactFormFieldKey,
  sortOrder: number,
): ContactFormField {
  return {
    id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    key,
    label: DEFAULT_LABELS[key],
    placeholder: DEFAULT_PLACEHOLDERS[key],
    required: key === "name",
    sortOrder,
  };
}

export const DEFAULT_CONTACT_FORM_FIELDS: ContactFormField[] = CONTACT_FORM_FIELD_KEYS.map((key, index) => ({
  id: `contact_${key}`,
  key,
  label: DEFAULT_LABELS[key],
  placeholder: DEFAULT_PLACEHOLDERS[key],
  required: key === "name",
  sortOrder: index,
}));

export function normalizeContactFormFields(fields: unknown): ContactFormField[] {
  if (!Array.isArray(fields)) {
    return [...DEFAULT_CONTACT_FORM_FIELDS];
  }

  const normalized = fields
    .map((field, index): ContactFormField | null => {
      if (!field || typeof field !== "object") return null;
      const candidate = field as Record<string, unknown>;
      if (!isContactFieldKey(candidate.key)) return null;

      const key = candidate.key;
      const id = String(candidate.id ?? "").trim();
      const label = String(candidate.label ?? "").trim();
      const placeholder = String(candidate.placeholder ?? "").trim();
      const sortOrderValue = Number(candidate.sortOrder);

      return {
        id: id || `cf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${index}`,
        key,
        label: label || DEFAULT_LABELS[key],
        placeholder: placeholder || DEFAULT_PLACEHOLDERS[key],
        required: Boolean(candidate.required),
        sortOrder: Number.isInteger(sortOrderValue) ? sortOrderValue : index,
      };
    })
    .filter((field): field is ContactFormField => !!field)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((field, index) => ({ ...field, sortOrder: index }));

  if (normalized.length === 0) {
    return [...DEFAULT_CONTACT_FORM_FIELDS];
  }

  return normalized;
}
