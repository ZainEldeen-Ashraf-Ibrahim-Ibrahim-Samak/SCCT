"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, buildSubmissionUrl } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import type { Submission } from "@/domain/entities/submission";

interface SubmissionsTableProps {
  submissions: Submission[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export function SubmissionsTable({ submissions, isLoading, onDelete, onRefresh }: SubmissionsTableProps) {
  const t = useTranslations("submissions");
  const tc = useTranslations("common");
  const router = useRouter();

  const getPrimaryContact = (submission: Submission) => {
    const fromContactRecords = submission.contactRecords.find((record) => (record.contact ?? "").trim().length > 0);
    if (fromContactRecords?.contact) {
      return fromContactRecords.contact;
    }

    const fromLegacyContact = submission.clientContact?.trim();
    return fromLegacyContact && fromLegacyContact.length > 0 ? fromLegacyContact : null;
  };

  // Controlled state for the delete confirmation dialog — decoupled from the dropdown
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleCopyLink = (token: string) => {
    const url = buildSubmissionUrl(token);
    navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await onDelete(deleteTargetId);
      toast.success(t("submissionDeleted"));
      onRefresh();
    } catch {
      toast.error(tc("error"));
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  if (isLoading && submissions.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="hidden md:table-cell whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="hidden sm:table-cell whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="text-end whitespace-nowrap"><Skeleton className="h-4 w-8 inline-block" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell className="w-full sm:w-auto">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20 mt-2 md:hidden" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-end"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                </TableRow>
             ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-muted/20">
        <p className="text-muted-foreground">{t("noSubmissionsFound")}</p>
      </div>
    );
  }

    const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="text-muted-foreground border-dashed">{t("statuses.draft")}</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">{t("statuses.pending")}</Badge>;
      case "viewed":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">{t("statuses.viewed")}</Badge>;
      case "needs_rewrite":
        return <Badge variant="destructive">{t("statuses.needs_rewrite")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getLatestUpdater = (sub: Submission) => {
    if (sub.auditTrail && sub.auditTrail.length > 0) {
      // Find the most recent audit entry where newStatus matches current status
      const updatedEntries = [...sub.auditTrail].reverse().find(entry => entry.newStatus === sub.status);
      if (updatedEntries) {
        return updatedEntries.adminName;
      }
    }
    return null;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">{t("clientName")}</TableHead>
              <TableHead className="hidden md:table-cell whitespace-nowrap">{t("clientContact")}</TableHead>
              <TableHead className="whitespace-nowrap">{tc("status")}</TableHead>
              <TableHead className="hidden sm:table-cell whitespace-nowrap">{t("submittedAt")}</TableHead>
              <TableHead className="text-end whitespace-nowrap">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((sub) => {
              const latestUpdater = getLatestUpdater(sub);
              const primaryContact = getPrimaryContact(sub);
              return (
                <TableRow key={sub.id} className="cursor-pointer group" onClick={() => router.push(`/admin/submissions/${sub.id}`)}>
                  <TableCell className="font-medium group-hover:text-primary transition-colors break-words">
                    {sub.clientName || t("unnamedSubmission")}
                    <div className="md:hidden mt-1 text-xs text-muted-foreground break-all">
                      {primaryContact || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell break-all">{primaryContact || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      {getStatusBadge(sub.status)}
                      {latestUpdater && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/60 px-1.5 py-0.5 rounded">
                           {t("updatedBy", { name: latestUpdater })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm whitespace-nowrap">
                    <span title={formatDate(sub.submittedAt)}>{formatDate(sub.submittedAt)}</span>
                    {sub.lastResubmittedAt && (
                      <span className="block text-xs text-amber-600/80 mt-0.5">
                        {t("resubmittedAt", { date: formatDate(sub.lastResubmittedAt) })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger nativeButton={true} render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                        <span className="sr-only">{t("openMenu")}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/submissions/${sub.id}`)}>
                          <Eye className="me-2 h-4 w-4" />
                          {t("viewDetail")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink(sub.accessToken)}>
                          <Copy className="me-2 h-4 w-4" />
                          {t("copyLink")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(sub.id)}>
                          <Trash2 className="me-2 h-4 w-4" />
                          {t("deleteSubmission")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog — rendered outside the DropdownMenu tree to avoid
          the dropdown's close lifecycle interfering with the dialog's open state */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteWarning")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>{tc("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
