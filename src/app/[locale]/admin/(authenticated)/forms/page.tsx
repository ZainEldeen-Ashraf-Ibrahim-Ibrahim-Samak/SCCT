import { FormManager } from "@/presentation/components/admin/form-manager";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const tForms = await getTranslations("forms");

  return {
    title: `${tForms("title")} — SCCT Admin`,
    description: tForms("subtitle"),
  };
}

export default function FormsPage() {
  return <FormManager />;
}
