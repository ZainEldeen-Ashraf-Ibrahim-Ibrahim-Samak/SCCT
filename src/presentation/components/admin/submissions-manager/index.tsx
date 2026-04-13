"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSubmissionsList } from "@/presentation/view-models/use-submissions-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SubmissionsTable } from "@/presentation/components/admin/submissions-table";
import { FileText, Clock, Eye, AlertCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

export function SubmissionsManager() {
  const t = useTranslations("submissions");
  const td = useTranslations("dashboard");
  const searchParams = useSearchParams();
  const expandId = searchParams.get("expand");

  const { submissions, total, totalPages, counts, isLoading, fetchSubmissions, deleteSubmission } = useSubmissionsList();
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // In a real app, search might be a separate API param. 
    // For now we use the existing fetchSubmissions which might only filter by status.
    fetchSubmissions(page, statusFilter);
  }, [page, statusFilter, fetchSubmissions]);

  const handleFilterChange = (val: string | null) => {
    if (val) {
      setStatusFilter(val);
      setPage(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{td("totalSubmissions")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{td("pendingCount")}</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{td("draftCount")}</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{td("viewedCount")}</CardTitle>
            <Eye className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.viewed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{td("needsRewriteCount")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.needs_rewrite}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("searchPlaceholder") || "Search submissions..."} 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-medium whitespace-nowrap">{td("filterByStatus")}:</span>
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={td("filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{td("allStatuses")}</SelectItem>
              <SelectItem value="pending">{td("pendingCount")}</SelectItem>
              <SelectItem value="draft">{td("draftCount")}</SelectItem>
              <SelectItem value="viewed">{td("viewedCount")}</SelectItem>
              <SelectItem value="needs_rewrite">{td("needsRewriteCount")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={expandId ? "ring-2 ring-primary ring-offset-4 rounded-lg" : ""}>
        <SubmissionsTable 
          submissions={submissions} 
          isLoading={isLoading} 
          onDelete={deleteSubmission}
          onRefresh={() => fetchSubmissions(page, statusFilter)} 
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 me-2" />
            {t("previous") || "Previous"}
          </Button>
          <div className="text-sm font-medium px-4">
            {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {t("next") || "Next"}
            <ChevronRight className="h-4 w-4 ms-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
