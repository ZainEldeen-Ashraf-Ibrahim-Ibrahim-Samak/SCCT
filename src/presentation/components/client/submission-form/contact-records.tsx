"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { ContactRecordDraft } from "@/presentation/view-models/use-submission";
import { MediaUpload } from "./media-upload";

interface ContactRecordsProps {
  records: ContactRecordDraft[];
  disabled?: boolean;
  showValidation?: boolean;
  onUpdate: (id: string, patch: Partial<Omit<ContactRecordDraft, "id">>) => void;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
}

interface ContactCardProps {
  record: ContactRecordDraft;
  index: number;
  disabled: boolean;
  canRemove: boolean;
  showValidation: boolean;
  onUpdate: ContactRecordsProps["onUpdate"];
  onRemove?: (id: string) => void;
}

function ContactCard({
  record,
  index,
  disabled,
  canRemove,
  onUpdate,
  onRemove,
}: ContactCardProps) {
  const t = useTranslations("client");

  return (
    <div className="rounded-lg border bg-background/80 p-4 space-y-3 relative group">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("contactRecordLabel", { index: index + 1 })}</p>
        
        {canRemove && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(record.id)}
            disabled={disabled}
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            title={t("remove")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor={`contact-name-${record.id}`}>{t("contactRecordName")}</Label>
          <Input
            id={`contact-name-${record.id}`}
            value={record.name}
            onChange={(e) => onUpdate(record.id, { name: e.target.value })}
            placeholder={t("contactRecordNamePlaceholder")}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`contact-email-${record.id}`}>{t("contactRecordEmail")}</Label>
          <Input
            id={`contact-email-${record.id}`}
            type="email"
            value={record.email}
            onChange={(e) => onUpdate(record.id, { email: e.target.value })}
            placeholder={t("contactRecordEmailPlaceholder")}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`contact-phone-${record.id}`}>{t("contactRecordPhone")}</Label>
          <Input
            id={`contact-phone-${record.id}`}
            value={record.phone}
            onChange={(e) => onUpdate(record.id, { phone: e.target.value })}
            placeholder={t("contactRecordPhonePlaceholder")}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`contact-role-${record.id}`}>{t("contactRecordRole")}</Label>
          <Input
            id={`contact-role-${record.id}`}
            value={record.role}
            onChange={(e) => onUpdate(record.id, { role: e.target.value })}
            placeholder={t("contactRecordRolePlaceholder")}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor={`contact-notes-${record.id}`}>{t("contactRecordNotes")}</Label>
          <Textarea
            id={`contact-notes-${record.id}`}
            value={record.notes}
            onChange={(e) => onUpdate(record.id, { notes: e.target.value })}
            placeholder={t("contactRecordNotesPlaceholder")}
            className="min-h-20"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2 sm:col-span-2 mt-2">
          <Label>{t("contactRecordAttachment")}</Label>
          <MediaUpload
            type="file"
            currentUrl={record.mediaUrl}
            onUpload={(url, publicId) =>
              onUpdate(record.id, {
                mediaUrl: url,
                mediaPublicId: publicId,
              })
            }
            onRemove={() =>
              onUpdate(record.id, {
                mediaUrl: null,
                mediaPublicId: null,
              })
            }
            maxFileSize={10}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

export function ContactRecords({
  records,
  disabled = false,
  showValidation = false,
  onUpdate,
  onAdd,
  onRemove,
}: ContactRecordsProps) {
  const t = useTranslations("client");

  const visibleRecords = useMemo(() => {
    if (records.length > 0) return records;
    return [
      {
        id: "fallback_contact_record",
        name: "",
        email: "",
        phone: "",
        role: "",
        notes: "",
      },
    ];
  }, [records]);

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-base font-semibold">
            {t("contactRecordsTitle")}
          </h4>
          <p className="text-xs text-muted-foreground">{t("contactRecordRequired")}</p>
        </div>
        {onAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            disabled={disabled}
            className="flex-shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addContactRecord")}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {visibleRecords.map((record, index) => (
          <ContactCard
            key={record.id}
            record={record}
            index={index}
            disabled={disabled}
            showValidation={showValidation}
            canRemove={visibleRecords.length > 1}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
