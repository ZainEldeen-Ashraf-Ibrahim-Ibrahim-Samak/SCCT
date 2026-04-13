import { MediaGallery } from "@/presentation/components/admin/media-gallery";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("media");
  return {
    title: `${t("title")} — SCCT Admin`,
    description: t("subtitle"),
  };
}

export default function MediaPage() {
  return (
    <div className="w-full">
      <MediaGallery />
    </div>
  );
}
