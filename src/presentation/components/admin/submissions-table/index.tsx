"use client";

import { useTranslations } from "next-intl";
import { Copy, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, buildSubmissionUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
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

  const handleCopyLink = (token: string) => {
    const url = buildSubmissionUrl(token);
    navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast.success(t("submissionDeleted"));
      onRefresh();
    } catch (err) {
      toast.error(tc("error"));
    }
  };

  if (isLoading && submissions.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-8" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("clientName")}</TableHead>
            <TableHead>{t("clientContact")}</TableHead>
            <TableHead>{tc("status")}</TableHead>
            <TableHead>{t("submittedAt")}</TableHead>
            <TableHead className="text-end">{tc("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => (
            <TableRow key={sub.id} className="cursor-pointer group" onClick={() => router.push(`/admin/submissions/${sub.id}`)}>
              <TableCell className="font-medium group-hover:text-primary transition-colors">
                {sub.clientName || t("unnamedSubmission")}
              </TableCell>
              <TableCell>{sub.clientContact || "—"}</TableCell>
              <TableCell>{getStatusBadge(sub.status)}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
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
                    <AlertDialog>
                      <AlertDialogTrigger nativeButton={false} render={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive" />}>
                        <Trash2 className="me-2 h-4 w-4" />
                        {t("deleteSubmission")}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("deleteWarning")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => { handleDelete(sub.id); }}>{tc("delete")}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
