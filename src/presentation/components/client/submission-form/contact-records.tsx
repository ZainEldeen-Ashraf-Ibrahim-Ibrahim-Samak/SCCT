"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ContactRecordDraft } from "@/presentation/view-models/use-submission";

interface ContactRecordsProps {
  records: ContactRecordDraft[];
  disabled?: boolean;
  showValidation?: boolean;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Omit<ContactRecordDraft, "id">>) => void;
  onRemove: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

interface ContactCardProps {
  record: ContactRecordDraft;
  index: number;
  canRemove: boolean;
  disabled: boolean;
  showValidation: boolean;
  onUpdate: ContactRecordsProps["onUpdate"];
  onRemove: ContactRecordsProps["onRemove"];
}

function SortableContactCard({
  record,
  index,
  canRemove,
  disabled,
  showValidation,
  onUpdate,
  onRemove,
}: ContactCardProps) {
  const t = useTranslations("client");
  const tc = useTranslations("common");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: record.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
    zIndex: isDragging ? 5 : 1,
  };

  const nameInvalid = showValidation && record.name.trim().length === 0;

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-background/80 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-muted/30 text-muted-foreground disabled:opacity-50"
            aria-label={t("dragToReorder")}
            title={t("dragToReorder")}
            disabled={disabled}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <p className="text-sm font-medium">{t("contactRecordLabel", { index: index + 1 })}</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(record.id)}
          disabled={disabled || !canRemove}
          title={t("removeContactRecord")}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
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
            className={nameInvalid ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {nameInvalid && <p className="text-xs text-destructive">{tc("required")}</p>}
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
          <Label htmlFor={`contact-contact-${record.id}`}>{t("contactRecordContact")}</Label>
          <Input
            id={`contact-contact-${record.id}`}
            value={record.contact}
            onChange={(e) => onUpdate(record.id, { contact: e.target.value })}
            placeholder={t("contactRecordContactPlaceholder")}
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
      </div>

      {!canRemove && (
        <p className="text-xs text-muted-foreground">{t("contactRecordMinOne")}</p>
      )}
    </div>
  );
}

export function ContactRecords({
  records,
  disabled = false,
  showValidation = false,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
}: ContactRecordsProps) {
  const t = useTranslations("client");

  const visibleRecords = useMemo(() => {
    if (records.length > 0) return records;
    return [
      {
        id: "fallback_contact_record",
        name: "",
        contact: "",
        role: "",
        notes: "",
      },
    ];
  }, [records]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = visibleRecords.map((record) => record.id);
    const oldIndex = currentIds.indexOf(String(active.id));
    const newIndex = currentIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const nextIds = [...currentIds];
    const [movedId] = nextIds.splice(oldIndex, 1);
    nextIds.splice(newIndex, 0, movedId);
    onReorder(nextIds);
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-base font-semibold">
            {t("contactRecordsTitle")} <span className="text-destructive">*</span>
          </h4>
          <p className="text-xs text-muted-foreground">{t("contactRecordMinOne")}</p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addContactRecord")}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleRecords.map((record) => record.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {visibleRecords.map((record, index) => (
              <SortableContactCard
                key={record.id}
                record={record}
                index={index}
                canRemove={visibleRecords.length > 1}
                disabled={disabled}
                showValidation={showValidation}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
