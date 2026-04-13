"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFormManager } from "@/presentation/view-models/use-form-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FileText, Trash2, Settings } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";

export function FormManager() {
  const t = useTranslations("forms");
  const tc = useTranslations("common");
  const { forms, isLoading, createForm, updateForm, deleteForm } = useFormManager();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormDesc, setNewFormDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    if (!newFormName.trim()) return;
    setIsCreating(true);
    try {
      await createForm(newFormName.trim(), newFormDesc.trim());
      setNewFormName("");
      setNewFormDesc("");
      setIsCreateOpen(false);
      toast.success(tc("success"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc("error"));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSetActive(id: string) {
    try {
      await updateForm(id, { isActive: true });
      toast.success(tc("success"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc("error"));
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteForm(id);
    if (result.success) {
      toast.success(tc("success"));
    } else {
      toast.error(result.error || tc("error"));
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
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
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("createForm")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createForm")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="form-name">{t("formName")}</Label>
                <Input
                  id="form-name"
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  placeholder={t("formName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-desc">{t("formDescription")}</Label>
                <Textarea
                  id="form-desc"
                  value={newFormDesc}
                  onChange={(e) => setNewFormDesc(e.target.value)}
                  placeholder={t("formDescription")}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newFormName.trim() || isCreating}
                className="w-full"
              >
                {tc("create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {forms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noForms")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card
              key={form.id}
              className={`transition-all hover:shadow-md ${form.isActive ? "ring-2 ring-primary" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    {form.description && (
                      <CardDescription>{form.description}</CardDescription>
                    )}
                  </div>
                  {form.isActive ? (
                    <Badge variant="default">{t("activeForm")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("inactiveForm")}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/forms/${form.id}/fields`}>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-1 h-3 w-3" />
                      {t("title")}
                    </Button>
                  </Link>
                  {!form.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetActive(form.id)}
                    >
                      {t("setActive")}
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="ms-auto text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("deleteWarning")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(form.id)}>
                          {tc("delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
