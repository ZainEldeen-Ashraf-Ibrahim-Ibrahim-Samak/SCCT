import { SubmissionReview } from "@/presentation/components/admin/submission-review";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Submission — SCCT Admin",
};

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  return <SubmissionReview id={id} />;
}
