import { SubmissionForm } from "@/presentation/components/client/submission-form";
import type { Metadata } from "next";
import { SITE_NAME } from "@/components/shared/site-name";

export const metadata: Metadata = {
  title: `Submit Data — ${SITE_NAME}`,
};

interface SubmitPageProps {
  params: Promise<{ token: string }>;
}

export default async function SubmitPage({ params }: SubmitPageProps) {
  const { token } = await params;
  return (
    <div className="min-h-screen bg-background pt-4 pb-12">
      <SubmissionForm tokenOrId={token} />
    </div>
  );
}
