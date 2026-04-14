"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactRecordDraft } from "@/presentation/view-models/use-submission";
import type { ContactFormField } from "@/domain/entities/form-template";

interface ContactRecordsProps {
  formFields: ContactFormField[];
  records: ContactRecordDraft[];
  disabled?: boolean;
  showValidation?: boolean;
  onUpdate: (id: string, patch: Partial<Omit<ContactRecordDraft, "id">>) => void;
}

export function ContactRecords({
  formFields,
  records,
  disabled = false,
  showValidation = false,
  onUpdate,
}: ContactRecordsProps) {
  const t = useTranslations("client");

  const contactRecord = useMemo<ContactRecordDraft>(() => {
    if (records.length > 0) return records[0];

    return {
      id: "fallback_contact_record",
      name: "",
      email: "",
      phone: "",
      address: "",
      mediaUrl: null,
      mediaPublicId: null,
    };
  }, [records]);

  const orderedFields = useMemo(
    () => [...formFields].sort((a, b) => a.sortOrder - b.sortOrder),
    [formFields],
  );

  const getFieldValue = (field: ContactFormField) => {
    switch (field.key) {
      case "name":
        return contactRecord.name;
      case "email":
        return contactRecord.email;
      case "phone":
        return contactRecord.phone;
      case "address":
        return contactRecord.address;
      default:
        return "";
    }
  };

  const updateFieldValue = (field: ContactFormField, value: string) => {
    if (field.key === "name") {
      onUpdate(contactRecord.id, { name: value });
      return;
    }

    if (field.key === "email") {
      onUpdate(contactRecord.id, { email: value });
      return;
    }

    if (field.key === "phone") {
      onUpdate(contactRecord.id, { phone: value });
      return;
    }

    onUpdate(contactRecord.id, { address: value });
  };

  const getInputType = (field: ContactFormField) => {
    if (field.key === "email") return "email";
    if (field.key === "phone") return "tel";
    return "text";
  };

  const getFallbackPlaceholder = (field: ContactFormField) => {
    if (field.key === "name") return t("contactRecordNamePlaceholder");
    if (field.key === "email") return t("contactRecordEmailPlaceholder");
    if (field.key === "phone") return t("contactRecordPhonePlaceholder");
    return t("contactRecordAddressPlaceholder");
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="space-y-1">
        <div className="space-y-1">
          <h4 className="text-base font-semibold">
            {t("contactFormTitle")}
          </h4>
          <p className="text-xs text-muted-foreground">{t("contactFormDescription")}</p>
        </div>
      </div>

      {showValidation && (
        <p className="text-sm text-destructive">{t("contactRecordRequired")}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {orderedFields.map((field) => (
          <div
            key={field.id}
            className={field.key === "address" ? "space-y-1 sm:col-span-2" : "space-y-1"}
          >
            <Label htmlFor={`contact-${field.key}-${field.id}`} className="flex items-center gap-1">
              <span>{field.label}</span>
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={`contact-${field.key}-${field.id}`}
              type={getInputType(field)}
              value={getFieldValue(field)}
              onChange={(e) => updateFieldValue(field, e.target.value)}
              placeholder={field.placeholder || getFallbackPlaceholder(field)}
              disabled={disabled}
              required={field.required}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
