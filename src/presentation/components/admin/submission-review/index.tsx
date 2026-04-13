"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useSubmissionsList } from "@/presentation/view-models/use-submissions-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Eye, AlertCircle, File, ArrowLeft } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { logger } from "@/lib/dev-logger";
import { formatDate } from "@/lib/utils";
import type { Submission } from "@/domain/entities/submission";
import type { FieldValue } from "@/domain/entities/field-value";

interface SubmissionReviewProps {
  id: string;
}

export function SubmissionReview({ id }: SubmissionReviewProps) {
  const t = useTranslations("submissions");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  
  const { updateStatus } = useSubmissionsList();
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [values, setValues] = useState<FieldValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rewriteComment, setRewriteComment] = useState("");

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const fetchRes = await fetch(`/api/submissions/${id}`);
        const json = await fetchRes.json();
        
        if (json.success && !json.data.isNew) {
           setSubmission(json.data.submission);
           setValues(json.data.values);
           // Auto mark as viewed if pending
           if (json.data.submission.status === "pending") {
              await updateStatus(json.data.submission.id, "viewed");
              setSubmission(prev => prev ? { ...prev, status: "viewed" } : null);
           }
        }
      } catch (error) {
        logger.error("Failed to fetch submission details", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubmission();
  }, [id, updateStatus]);

  const handleStatusChange = async (status: string) => {
    if (status === "needs_rewrite" && !rewriteComment.trim()) return;
    
    setIsUpdating(true);
    try {
      await updateStatus(id, status, status === "needs_rewrite" ? rewriteComment : undefined);
      setSubmission(prev => {
        if (!prev) return prev;
        const newTrack = [...prev.auditTrail, {
          oldStatus: prev.status,
          newStatus: status as any,
          comment: status === "needs_rewrite" ? rewriteComment : undefined,
          adminId: "optimistic",
          adminName: t("optimisticAdminName"),
          timestamp: new Date()
        }];
        return { ...prev, status: status as any, auditTrail: newTrack };
      });
      if (status !== "needs_rewrite") {
        setRewriteComment(""); // Clear comment if moving away from needs_rewrite
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{tc("noResults")}</p>
        <Button variant="link" onClick={() => router.push("/admin/dashboard")}>{tc("back")}</Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-5 w-5 text-amber-500" />;
      case "viewed": return <Eye className="h-5 w-5 text-emerald-500" />;
      case "needs_rewrite": return <AlertCircle className="h-5 w-5 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/admin/dashboard">
        <Button variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tc("back")}
        </Button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{submission.clientName}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {submission.clientContact || t("noContactInfoProvided")}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={submission.status === "needs_rewrite" ? "destructive" : "secondary"} className="text-sm px-3 py-1 flex items-center gap-1.5">
                    {getStatusIcon(submission.status)}
                    {t(`statuses.${submission.status}`)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(submission.submittedAt)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {submission.formSnapshot.map((field) => {
                  const val = values.find(v => v.fieldDefinitionId === field.id);
                  const displayName = locale === "ar" ? field.nameAr || field.nameEn : field.nameEn;
                  
                  return (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-base font-semibold text-foreground/80">{displayName}</Label>
                      <div className="bg-muted/30 p-4 rounded-lg border">
                        {val?.mediaUrl ? (
                          field.inputType === "image" ? (
                            <div className="relative h-64 w-full sm:w-96 rounded-md overflow-hidden bg-muted">
                              <Image 
                                src={val.mediaUrl} 
                                alt={displayName} 
                                fill 
                                className="object-contain" 
                                sizes="(max-width: 768px) 100vw, 384px"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                                <File className="h-5 w-5 text-primary" />
                              </div>
                              <a 
                                href={val.mediaUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                {tc("download")}
                              </a>
                            </div>
                          )
                        ) : val?.value ? (
                          <p className="whitespace-pre-wrap">{val.value.toString()}</p>
                        ) : (
                          <p className="text-muted-foreground italic text-sm">{tc("noResults")}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{tc("actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col">
              {submission.status !== "viewed" && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange("viewed")}
                >
                  <Eye className="mr-2 h-4 w-4 text-emerald-500" />
                  {t("markViewed")}
                </Button>
              )}
              
              <div className="pt-4 border-t space-y-3">
                <Label>{t("rewriteComment")}</Label>
                <Textarea 
                  value={rewriteComment}
                  onChange={(e) => setRewriteComment(e.target.value)}
                  placeholder={t("rewriteCommentPlaceholder")}
                  className="min-h-[100px] resize-none"
                />
                <Button 
                  variant={submission.status === "needs_rewrite" ? "secondary" : "destructive"}
                  className="w-full"
                  disabled={isUpdating || !rewriteComment.trim() || submission.status === "needs_rewrite"}
                  onClick={() => handleStatusChange("needs_rewrite")}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {t("markNeedsRewrite")}
                </Button>
                {!rewriteComment.trim() && submission.status !== "needs_rewrite" && (
                   <p className="text-xs text-muted-foreground text-center">{t("rewriteCommentRequired")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle className="text-lg">{t("auditTrail")}</CardTitle>
            </CardHeader>
            <CardContent>
               {submission.auditTrail.length === 0 ? (
                 <p className="text-sm text-muted-foreground italic">{tc("noResults")}</p>
               ) : (
                 <div className="space-y-4">
                   {submission.auditTrail.slice().reverse().map((entry, i) => (
                     <div key={i} className="text-sm relative pl-4 border-l-2 border-muted">
                        <div className="absolute w-2 h-2 rounded-full bg-primary -left-[5px] top-1.5 ring-4 ring-background" />
                        <p className="font-medium">
                          {t("auditEntry", { admin: entry.adminName, oldStatus: t(`statuses.${entry.oldStatus}`), newStatus: t(`statuses.${entry.newStatus}`) })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.timestamp)}</p>
                        {entry.comment && (
                          <div className="mt-1 p-2 bg-muted/50 rounded text-xs italic border-l-2 border-destructive/50">
                            &quot;{entry.comment}&quot;
                          </div>
                        )}
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
