"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { FieldCard } from "./field-card";
import { FieldFormDialog } from "./field-form-dialog";
import type { FieldDefinition } from "@/domain/entities/field-definition";

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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
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
