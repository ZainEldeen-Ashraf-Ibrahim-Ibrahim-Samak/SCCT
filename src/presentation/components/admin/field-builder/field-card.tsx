"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { FieldDefinition } from "@/domain/entities/field-definition";

interface FieldCardProps {
  field: FieldDefinition;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function FieldCard({ field, onEdit, onDelete }: FieldCardProps) {
  const t = useTranslations("fields");
  const tc = useTranslations("common");
  const locale = useLocale();

  const displayName = locale === "ar" ? field.nameAr : field.nameEn;

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{displayName}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {t(`types.${field.inputType}`)}
            </Badge>
            {field.validationRules?.required && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {tc("required")}
              </Badge>
            )}
          </div>
          {locale === "ar" && field.nameEn && (
            <p className="text-xs text-muted-foreground mt-0.5">{field.nameEn}</p>
          )}
          {locale !== "ar" && field.nameAr && (
            <p className="text-xs text-muted-foreground mt-0.5 font-arabic">{field.nameAr}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" />}>
              <Trash2 className="h-4 w-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tc("delete")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tc("deleteConfirm")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                  {tc("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
