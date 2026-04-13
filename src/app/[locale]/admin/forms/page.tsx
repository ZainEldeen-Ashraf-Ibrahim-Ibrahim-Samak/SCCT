import { FormManager } from "@/presentation/components/admin/form-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Form Templates — SCCT Admin",
  description: "Manage data collection form templates",
};

export default function FormsPage() {
  return <FormManager />;
}
