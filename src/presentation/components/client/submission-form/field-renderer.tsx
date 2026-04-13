"use client";

import { useTranslations, useLocale } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaUpload } from "./media-upload";
import type { FieldDefinition } from "@/domain/entities/field-definition";

interface FieldRendererProps {
  field: FieldDefinition;
  value?: string | number | null;
  mediaUrl?: string | null;
  mediaPublicId?: string | null;
  onChangeValue: (val: string | number | null) => void;
  onChangeMedia: (url: string, publicId: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

export function FieldRenderer({
  field,
  value,
  mediaUrl,
  onChangeValue,
  onChangeMedia,
  hasError = false,
  disabled = false,
}: FieldRendererProps) {
  const locale = useLocale();
  const tc = useTranslations("common");

  const displayName = locale === "ar" ? field.nameAr : field.nameEn;
  const isRequired = field.validationRules?.required;
  const { minLength, maxLength, min, max } = field.validationRules ?? {};

  const LabelComponent = () => (
    <div className="flex items-center gap-1 mb-2">
      <Label htmlFor={field.id} className={`${hasError ? "text-destructive" : ""} text-base`}>
        {displayName}
      </Label>
      {isRequired && <span className="text-destructive font-bold">*</span>}
    </div>
  );

  switch (field.inputType) {
    case "text":
      // If no max length or large max length, use textarea, else input
      if (!maxLength || maxLength > 100) {
        return (
          <div className="space-y-1">
            <LabelComponent />
            <Textarea
              id={field.id}
              value={(value as string) || ""}
              onChange={(e) => onChangeValue(e.target.value)}
              placeholder={displayName}
              required={isRequired}
              minLength={minLength}
              maxLength={maxLength}
              disabled={disabled}
              className={hasError ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </div>
        );
      }
      return (
        <div className="space-y-1">
          <LabelComponent />
          <Input
            id={field.id}
            value={(value as string) || ""}
            onChange={(e) => onChangeValue(e.target.value)}
            placeholder={displayName}
            required={isRequired}
            minLength={minLength}
            maxLength={maxLength}
            disabled={disabled}
            className={hasError ? "border-destructive focus-visible:ring-destructive" : ""}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-1">
          <LabelComponent />
          <Input
            id={field.id}
            type="number"
            value={value === null || value === undefined ? "" : value}
            onChange={(e) => onChangeValue(e.target.value ? Number(e.target.value) : null)}
            placeholder={"0"}
            required={isRequired}
            min={min}
            max={max}
            disabled={disabled}
            className={hasError ? "border-destructive focus-visible:ring-destructive" : ""}
          />
        </div>
      );

    case "date":
      return (
        <div className="space-y-1">
          <LabelComponent />
          <Input
            id={field.id}
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChangeValue(e.target.value)}
            required={isRequired}
            disabled={disabled}
            className={hasError ? "border-destructive focus-visible:ring-destructive" : ""}
          />
        </div>
      );

    case "dropdown":
      const options = locale === "ar" ? field.dropdownOptionsAr : field.dropdownOptionsEn;
      const valStr = value?.toString();
      // Ensure we have a valid matched option if it exists
      const matchIndex = locale === "en"
        ? field.dropdownOptionsEn.indexOf(valStr || "")
        : field.dropdownOptionsAr.indexOf(valStr || "");

      // Next select needs the value. If cross-language match we select the localized version.
      // But underlying value saved needs to be consistent. Let's save the English one as source-of-truth if possible,
      // or just the localized one depending on constraints. For simplicity, we just save the index essentially via exact string match,
      // but the data model currently just saves the string. We'll save the localized string.
      return (
        <div className="space-y-1">
          <LabelComponent />
          <Select
            value={(value as string) || ""}
            onValueChange={(val) => onChangeValue(val)}
            disabled={disabled}
          >
            <SelectTrigger className={hasError ? "border-destructive ring-destructive" : ""}>
              <SelectValue placeholder={tc("optional")} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt, i) => (
                <SelectItem key={i} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "image":
    case "file":
      return (
        <div className="space-y-1">
          <LabelComponent />
          <MediaUpload
            type={field.inputType}
            currentUrl={mediaUrl}
            onUpload={(url, pubId) => onChangeMedia(url, pubId)}
            onRemove={() => {
              onChangeMedia("", "");
              onChangeValue(null);
            }}
            maxFileSize={field.validationRules?.maxFileSize}
            disabled={disabled}
          />
          {hasError && <p className="text-xs text-destructive">{tc("required")}</p>}
        </div>
      );

    default:
      return null;
  }
}
