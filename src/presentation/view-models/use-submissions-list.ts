"use client";

import { useState, useCallback } from "react";
import type { Submission } from "@/domain/entities/submission";

interface UseSubmissionsListReturn {
  submissions: Submission[];
  total: number;
  totalPages: number;
  counts: { pending: number; draft: number; viewed: number; needs_rewrite: number; total: number };
  isLoading: boolean;
  error: string | null;
  fetchSubmissions: (page: number, status: string) => Promise<void>;
  updateStatus: (id: string, status: string, comment?: string) => Promise<void>;
  deleteSubmission: (id: string) => Promise<void>;
}

export function useSubmissionsList(): UseSubmissionsListReturn {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ pending: 0, draft: 0, viewed: 0, needs_rewrite: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    try {
      const res = await fetch("/api/admin/submissions/counts", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setCounts(json.data);
    } catch {
      // Background count fetch failure is non-fatal
    }
  };

  const fetchSubmissions = useCallback(async (page: number, status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/admin/submissions?page=${page}&status=${encodeURIComponent(status)}`;
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!json.success) throw new Error(json.error);

      setSubmissions(json.data.submissions);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);

      fetchCounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStatus = async (id: string, status: string, comment?: string) => {
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, comment }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await fetchCounts(); // Update counts locally since status changed
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("submissions-updated"));
    }
  };

  const deleteSubmission = async (id: string) => {
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
  };

  return {
    submissions,
    total,
    totalPages,
    counts,
    isLoading,
    error,
    fetchSubmissions,
    updateStatus,
    deleteSubmission,
  };
}
