"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { ContactRecordDraft } from "@/presentation/view-models/use-submission";

interface ContactRecordsProps {
  records: ContactRecordDraft[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Omit<ContactRecordDraft, "id">>) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function ContactRecords({
  records,
  onAdd,
  onUpdate,
  onRemove,
  disabled = false,
}: ContactRecordsProps) {
  const t = useTranslations("client");

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold">{t("contactRecordsTitle")}</h4>
        {!disabled && (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="me-2 h-4 w-4" />
            {t("addContactRecord")}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {records.map((record, index) => {
          const allowDelete = records.length > 1;

          return (
            <div key={record.id} className="rounded-lg border bg-background/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {t("contactRecordLabel", { index: index + 1 })}
                </p>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(record.id)}
                    disabled={!allowDelete}
                    title={allowDelete ? t("removeContactRecord") : t("contactRecordMinOne")}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("contactRecordName")}</Label>
                  <Input
                    value={record.name}
                    onChange={(e) => onUpdate(record.id, { name: e.target.value })}
                    placeholder={t("contactRecordNamePlaceholder")}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("contactRecordContact")}</Label>
                  <Input
                    value={record.contact}
                    onChange={(e) => onUpdate(record.id, { contact: e.target.value })}
                    placeholder={t("contactRecordContactPlaceholder")}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("contactRecordRole")}</Label>
                  <Input
                    value={record.role}
                    onChange={(e) => onUpdate(record.id, { role: e.target.value })}
                    placeholder={t("contactRecordRolePlaceholder")}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("contactRecordNotes")}</Label>
                  <Textarea
                    value={record.notes}
                    onChange={(e) => onUpdate(record.id, { notes: e.target.value })}
                    placeholder={t("contactRecordNotesPlaceholder")}
                    disabled={disabled}
                    className="min-h-20"
                  />
                </div>
              </div>

              {!allowDelete && (
                <p className="mt-3 text-xs text-muted-foreground">{t("contactRecordMinOne")}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
