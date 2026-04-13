"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import type { ContactRecordDraft } from "@/presentation/view-models/use-submission";

interface ContactRecordsProps {
  records: ContactRecordDraft[];
}

export function ContactRecords({
  records,
}: ContactRecordsProps) {
  const t = useTranslations("client");
  const tc = useTranslations("common");
  const visibleRecords = records.length > 0 ? records : [createFallbackRecord()];

  function createFallbackRecord(): ContactRecordDraft {
    return {
      id: "fallback_contact_record",
      name: "",
      contact: "",
      role: "",
      notes: "",
    };
  }

  function showValue(value: string) {
    return value.trim().length > 0 ? value : tc("noResults");
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold">
          {t("contactRecordsTitle")} <span className="text-destructive">*</span>
        </h4>
      </div>

      <div className="space-y-4">
        {visibleRecords.map((record, index) => {
          const allowDelete = visibleRecords.length > 1;

          return (
            <div key={record.id} className="rounded-lg border bg-background/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {t("contactRecordLabel", { index: index + 1 })}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <Label>{t("contactRecordName")}</Label>
                  <p className="rounded-md border bg-muted/30 px-3 py-2">{showValue(record.name)}</p>
                </div>
                <div className="space-y-1">
                  <Label>{t("contactRecordContact")}</Label>
                  <p className="rounded-md border bg-muted/30 px-3 py-2">{showValue(record.contact)}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>{t("contactRecordRole")}</Label>
                  <p className="rounded-md border bg-muted/30 px-3 py-2">{showValue(record.role)}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>{t("contactRecordNotes")}</Label>
                  <p className="rounded-md border bg-muted/30 px-3 py-2 whitespace-pre-wrap">{showValue(record.notes)}</p>
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
