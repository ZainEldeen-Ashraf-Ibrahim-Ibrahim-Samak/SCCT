import { SettingsForm } from "@/presentation/components/admin/settings-form";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminSettings");
  return {
    title: `${t("title")} — SCCT Admin`,
    description: t("subtitle"),
  };
}

export default function SettingsPage() {
  return (
    <div className="w-full">
      <SettingsForm />
    </div>
  );
}
