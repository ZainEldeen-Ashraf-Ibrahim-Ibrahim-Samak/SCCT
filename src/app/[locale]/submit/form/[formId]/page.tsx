import { SubmissionForm } from "@/presentation/components/client/submission-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Data — SCCT",
};

interface SubmitFormPageProps {
  params: Promise<{ formId: string }>;
}

export default async function SubmitFormPage({ params }: SubmitFormPageProps) {
  const { formId } = await params;
  return (
    <div className="min-h-screen bg-background pt-4 pb-12">
      <SubmissionForm tokenOrId={formId} isExplicitForm={true} />
    </div>
  );
}
