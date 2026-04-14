"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useFieldBuilder } from "@/presentation/view-models/use-field-builder";
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
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FieldCard } from "./field-card";
import { FieldFormDialog } from "./field-form-dialog";
import type { FieldDefinition } from "@/domain/entities/field-definition";

interface ContactRecordDraft {
  id: string;
  name: string;
  contact: string;
  role: string;
  notes: string;
}

function normalizeContactDraft(record: ContactRecordDraft): ContactRecordDraft {
  return {
    id: String(record.id ?? "").trim(),
    name: String(record.name ?? "").trim(),
    contact: String(record.contact ?? "").trim(),
    role: String(record.role ?? "").trim(),
    notes: String(record.notes ?? "").trim(),
  };
}

function areContactDraftListsEqual(a: ContactRecordDraft[], b: ContactRecordDraft[]) {
  if (a.length !== b.length) return false;

  return a.every((record, index) => {
    const other = b[index];
    if (!other) return false;

    return (
      record.id === other.id &&
      record.name === other.name &&
      record.contact === other.contact &&
      record.role === other.role &&
      record.notes === other.notes
    );
  });
}

function createContactRecord(): ContactRecordDraft {
  return {
    id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    contact: "",
    role: "",
    notes: "",
  };
}

interface FieldBuilderProps {
  formTemplateId: string;
}

export function FieldBuilder({ formTemplateId }: FieldBuilderProps) {
  const t = useTranslations("fields");
  const tc = useTranslations("common");
  const { fields, isLoading, createField, updateField, deleteField, reorderFields } =
    useFieldBuilder(formTemplateId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [contactRecords, setContactRecords] = useState<ContactRecordDraft[]>([createContactRecord()]);
  const [savedContactRecords, setSavedContactRecords] = useState<ContactRecordDraft[]>([createContactRecord()]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isSavingContacts, setIsSavingContacts] = useState(false);
  const [showContactValidation, setShowContactValidation] = useState(false);

  const fetchFormContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    try {
      const res = await fetch(`/api/admin/forms/${formTemplateId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch form");
      }

      const records = Array.isArray(data.data?.contactRecords) ? data.data.contactRecords : [];
      const normalized = (records.length > 0 ? records : [createContactRecord()]).map(normalizeContactDraft);

      setContactRecords(normalized);
      setSavedContactRecords(normalized);
      setShowContactValidation(false);
    } catch (error) {
      const fallback = [createContactRecord()];
      setContactRecords(fallback);
      setSavedContactRecords(fallback);
      toast.error(error instanceof Error ? error.message : tc("error"));
    } finally {
      setIsLoadingContacts(false);
    }
  }, [formTemplateId, tc]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...fields];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const fieldOrder = reordered.map((f, i) => ({
      fieldId: f.id,
      sortOrder: i,
    }));

    try {
      await reorderFields(fieldOrder);
    } catch {
      toast.error(tc("error"));
    }
  }

  async function handleSaveField(data: Record<string, unknown>) {
    try {
      if (editingField) {
        await updateField(editingField.id, data);
      } else {
        await createField(data);
      }
      setIsDialogOpen(false);
      setEditingField(null);
      toast.success(tc("success"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc("error"));
    }
  }

  async function handleDeleteField(id: string) {
    try {
      await deleteField(id);
      toast.success(tc("success"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc("error"));
    }
  }

  function handleEdit(field: FieldDefinition) {
    setEditingField(field);
    setIsDialogOpen(true);
  }

  const normalizedContactRecords = useMemo(
    () => contactRecords.map(normalizeContactDraft),
    [contactRecords],
  );

  const hasContactChanges = useMemo(
    () => !areContactDraftListsEqual(normalizedContactRecords, savedContactRecords),
    [normalizedContactRecords, savedContactRecords],
  );

  useEffect(() => {
    void fetchFormContacts();
  }, [fetchFormContacts]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  async function handleSaveContacts() {
    setShowContactValidation(true);
    const normalized = normalizedContactRecords.filter((record) => record.id.length > 0 && record.name.length > 0);

    if (normalized.length < 1 || normalized.length !== normalizedContactRecords.length) {
      toast.error(t("contactRecordMinOne"));
      return;
    }

    setIsSavingContacts(true);
    try {
      const res = await fetch(`/api/admin/forms/${formTemplateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactRecords: normalized }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save contacts");
      }
      setContactRecords(normalized);
      setSavedContactRecords(normalized);
      setShowContactValidation(false);
      toast.success(tc("success"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tc("error"));
    } finally {
      setIsSavingContacts(false);
    }
  }

  function handleAddContact() {
    setShowContactValidation(false);
    setContactRecords((prev) => [...prev, createContactRecord()]);
  }

  function handleUpdateContact(id: string, patch: Partial<Omit<ContactRecordDraft, "id">>) {
    setShowContactValidation(false);
    setContactRecords((prev) =>
      prev.map((record) =>
        record.id === id
          ? {
              ...record,
              name: patch.name ?? record.name,
              contact: patch.contact ?? record.contact,
              role: patch.role ?? record.role,
              notes: patch.notes ?? record.notes,
            }
          : record,
      ),
    );
  }

  function handleRemoveContact(id: string) {
    setShowContactValidation(false);
    setContactRecords((prev) => (prev.length <= 1 ? prev : prev.filter((record) => record.id !== id)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => {
            setEditingField(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("addField")}
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">{t("noFields")}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fields.map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  onEdit={() => handleEdit(field)}
                  onDelete={() => handleDeleteField(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{t("contactRecordsTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("contactRecordMinOne")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddContact}
            disabled={isLoadingContacts || isSavingContacts}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addContactRecord")}
          </Button>
        </div>

        <div className="space-y-3">
          {isLoadingContacts
            ? [1, 2].map((item) => <Skeleton key={item} className="h-52 w-full rounded-md" />)
            : contactRecords.map((record, index) => {
                const isNameInvalid = showContactValidation && record.name.trim().length === 0;

                return (
                  <div key={record.id} className="rounded-md border bg-background p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>{t("contactRecordLabel", { index: index + 1 })}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveContact(record.id)}
                        disabled={contactRecords.length <= 1 || isSavingContacts}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor={`contact-name-${record.id}`}>{t("contactRecordName")}</Label>
                        <Input
                          id={`contact-name-${record.id}`}
                          value={record.name}
                          onChange={(e) => handleUpdateContact(record.id, { name: e.target.value })}
                          placeholder={t("contactRecordName")}
                          className={isNameInvalid ? "border-destructive focus-visible:ring-destructive" : ""}
                          disabled={isSavingContacts}
                        />
                        {isNameInvalid && <p className="text-xs text-destructive">{tc("required")}</p>}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`contact-contact-${record.id}`}>{t("contactRecordContact")}</Label>
                        <Input
                          id={`contact-contact-${record.id}`}
                          value={record.contact}
                          onChange={(e) => handleUpdateContact(record.id, { contact: e.target.value })}
                          placeholder={t("contactRecordContact")}
                          disabled={isSavingContacts}
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label htmlFor={`contact-role-${record.id}`}>{t("contactRecordRole")}</Label>
                        <Input
                          id={`contact-role-${record.id}`}
                          value={record.role}
                          onChange={(e) => handleUpdateContact(record.id, { role: e.target.value })}
                          placeholder={t("contactRecordRole")}
                          disabled={isSavingContacts}
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label htmlFor={`contact-notes-${record.id}`}>{t("contactRecordNotes")}</Label>
                        <Textarea
                          id={`contact-notes-${record.id}`}
                          value={record.notes}
                          onChange={(e) => handleUpdateContact(record.id, { notes: e.target.value })}
                          placeholder={t("contactRecordNotes")}
                          className="min-h-16"
                          disabled={isSavingContacts}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        <div className="flex items-center justify-between gap-3">
          {!isLoadingContacts && (
            <Badge variant={hasContactChanges ? "secondary" : "outline"}>
              {hasContactChanges ? t("contactChangesPending") : t("contactChangesSaved")}
            </Badge>
          )}
          <Button
            type="button"
            onClick={handleSaveContacts}
            disabled={isLoadingContacts || isSavingContacts || !hasContactChanges}
          >
            {isSavingContacts ? tc("loading") : tc("save")}
          </Button>
        </div>
      </div>

      <FieldFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingField(null);
        }}
        field={editingField}
        onSave={handleSaveField}
      />
    </div>
  );
}
