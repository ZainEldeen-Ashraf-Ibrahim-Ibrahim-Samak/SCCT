"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSubmission } from "@/presentation/view-models/use-submission";
import { FieldRenderer } from "./field-renderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SubmissionFormProps {
  tokenOrId: string;
}

export function SubmissionForm({ tokenOrId }: SubmissionFormProps) {
  const t = useTranslations("client");
  const tp = useTranslations("submissions.statuses");
  const {
    isNew,
    isLoading,
    isSubmitting,
    error,
    formName,
    formDescription,
    fields,
    submission,
    formData,
    clientName,
    setClientName,
    clientContact,
    setClientContact,
    setFieldValue,
    setMediaValue,
    setMediaItems,
    submitForm,
    resubmitForm,
    statusChangedLive,
  } = useSubmission(tokenOrId);

  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Render logic...
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error === "not_found") {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{t("invalidLink")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isNeedsRewrite = submission?.status === "needs_rewrite";
  const isDraft = submission?.status === "draft";
  const isViewOnly = !isNew && !isNeedsRewrite && !isDraft;

  const validate = () => {
    const errors: Record<string, boolean> = {};
    let isValid = true;

    if (!clientName.trim()) {
      errors.clientName = true;
      isValid = false;
    }

    fields.forEach((f) => {
      if (f.validationRules?.required) {
        const val = formData[f.id];
        const hasMedia = val?.mediaUrl && val.mediaUrl.trim().length > 0;
        const hasMediaItems = val?.mediaItems && val.mediaItems.length > 0;
        const hasText = val?.value !== undefined && val?.value !== null && String(val.value).trim().length > 0;

        if (!hasMedia && !hasText && !hasMediaItems) {
          errors[f.id] = true;
          isValid = false;
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isNew) {
      await submitForm();
    } else if (isNeedsRewrite || isDraft) {
      await resubmitForm();
    }
  };

  let statusAlert = null;
  if (submission && !isNeedsRewrite && !isDraft) {
     statusAlert = (
       <Alert className="mb-6 bg-primary/5 border-primary/20">
         <CheckCircle2 className="h-4 w-4 text-primary" />
         <AlertTitle>{t("submissionSuccess")}</AlertTitle>
         <AlertDescription className="text-muted-foreground">
           {submission.status === "viewed" ? t("statusViewed") : t("statusPending")}
         </AlertDescription>
       </Alert>
     );
  } else if (isNeedsRewrite) {
    statusAlert = (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("needsRewriteTitle")}</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{t("needsRewriteMessage")}</p>
          <div className="mt-2 text-sm italic border-s-2 border-destructive/50 ps-3">
            &quot;{submission?.rewriteComment}&quot;
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {statusAlert}

      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-4 pb-8">
          <div>
            <CardTitle className="text-3xl font-extrabold">{formName}</CardTitle>
            {formDescription && (
              <CardDescription className="text-base mt-2 whitespace-pre-wrap">
                {formDescription}
              </CardDescription>
            )}
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            <div className="space-y-4 bg-muted/30 p-6 rounded-xl border border-border/50">
              <h3 className="font-semibold text-lg">{isNew || isDraft ? t("formSubtitle") : t("viewingSubmission")}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className={validationErrors.clientName ? "text-destructive" : ""}>
                    {t("yourName")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      if (validationErrors.clientName) setValidationErrors(prev => ({ ...prev, clientName: false }));
                    }}
                    disabled={isViewOnly}
                    placeholder={t("namePlaceholder")}
                    className={validationErrors.clientName ? "border-destructive" : ""}
                  />
                  {validationErrors.clientName && <p className="text-xs text-destructive">{t("fieldRequired")}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientContact">{t("contactInfo")}</Label>
                  <Input
                    id="clientContact"
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    disabled={isViewOnly}
                    placeholder={t("contactPlaceholder")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {fields.map((field) => {
                 const currentVal = formData[field.id];
                 return (
                   <div key={field.id} className="p-1">
                     <FieldRenderer
                        field={field}
                        value={currentVal?.value}
                        mediaUrl={currentVal?.mediaUrl}
                        mediaPublicId={currentVal?.mediaPublicId}
                        mediaItems={currentVal?.mediaItems}
                        onChangeValue={(v) => {
                           setFieldValue(field.id, v);
                           if (validationErrors[field.id]) setValidationErrors(prev => ({ ...prev, [field.id]: false }));
                        }}
                        onChangeMedia={(url, pid) => {
                           setMediaValue(field.id, url, pid);
                           if (validationErrors[field.id]) setValidationErrors(prev => ({ ...prev, [field.id]: false }));
                        }}
                        onChangeMediaItems={(items) => {
                           setMediaItems(field.id, items);
                           if (validationErrors[field.id]) setValidationErrors(prev => ({ ...prev, [field.id]: false }));
                        }}
                        hasError={validationErrors[field.id]}
                        disabled={isViewOnly}
                      />
                   </div>
                 );
              })}
            </div>
          </CardContent>

          {error && error !== "not_found" && (
            <div className="px-6 pb-2">
               <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!isViewOnly && (
            <CardFooter className="bg-muted/10 pt-6 mt-4 border-t">
              <Button type="submit" className="w-full sm:w-auto" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="me-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="me-2 h-5 w-5" />
                )}
                {isNew || isDraft ? t("submitButton") : t("resubmitButton")}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
