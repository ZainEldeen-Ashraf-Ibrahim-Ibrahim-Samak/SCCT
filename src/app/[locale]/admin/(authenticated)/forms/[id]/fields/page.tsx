import { FieldBuilder } from "@/presentation/components/admin/field-builder";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Field Builder — SCCT Admin",
  description: "Define fields for your data collection form",
};

interface FieldsPageProps {
  params: Promise<{ id: string }>;
}

export default async function FieldsPage({ params }: FieldsPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <Link href="/admin/forms">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forms
        </Button>
      </Link>
      <FieldBuilder formTemplateId={id} />
    </div>
  );
}
