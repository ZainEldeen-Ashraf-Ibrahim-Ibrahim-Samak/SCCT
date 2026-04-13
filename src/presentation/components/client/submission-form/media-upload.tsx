"use client";

import { useTranslations } from "next-intl";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, File, X, UploadCloud } from "lucide-react";
import Image from "next/image";
import { formatFileSize } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/dev-logger";

interface MediaUploadProps {
  type: "image" | "file";
  currentUrl?: string | null;
  onUpload: (url: string, publicId: string) => void;
  onRemove: () => void;
  maxFileSize?: number; // In MB
  disabled?: boolean;
}

export function MediaUpload({
  type,
  currentUrl,
  onUpload,
  onRemove,
  maxFileSize = 10,
  disabled = false,
}: MediaUploadProps) {
  const t = useTranslations("client");
  const tc = useTranslations("common");
  const [isRemoving, setIsRemoving] = useState(false);

  // Fallback signature endpoint
  const signatureEndpoint = "/api/cloudinary/sign";

  const handleSuccess = (result: any) => {
    if (result?.info && typeof result.info !== "string" && result.info.secure_url) {
      onUpload(result.info.secure_url, result.info.public_id ?? "");
      toast.success(t("uploadSuccess"));
    }
  };

  const handleError = (error: unknown) => {
    logger.error("Cloudinary upload failed", error);
    toast.error(t("uploadError"));
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    // Ideally call API to destroy, but for now just clear local state.
    // Cleanup of orphans runs periodically on server.
    onRemove();
    setIsRemoving(false);
  };

  if (currentUrl) {
    return (
      <div className="relative group rounded-lg border bg-muted/30 overflow-hidden w-fit max-w-full">
        {type === "image" ? (
          <div className="relative h-48 w-48 sm:h-64 sm:w-64">
            <Image
              src={currentUrl}
              alt="Uploaded field"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 192px, 256px"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
              <File className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[200px]">
                {currentUrl.split("/").pop()}
              </p>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                {tc("download")}
              </a>
            </div>
          </div>
        )}

        {!disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // If disabled and no file
  if (disabled) {
    return (
      <div className="h-24 border-2 border-dashed rounded-xl flex items-center justify-center bg-muted/50">
        <p className="text-sm text-muted-foreground">{tc("noResults")}</p>
      </div>
    );
  }

  return (
    <CldUploadWidget
      signatureEndpoint={signatureEndpoint}
      options={{
        multiple: false,
        maxFiles: 1,
        maxFileSize: maxFileSize * 1024 * 1024,
        resourceType: type === "image" ? "image" : "auto",
        clientAllowedFormats:
          type === "image" ? ["png", "jpg", "jpeg", "webp"] : undefined,
      }}
      onSuccess={handleSuccess}
      onError={handleError}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className="w-full sm:w-auto h-32 px-8 border-2 border-dashed rounded-xl transition-colors hover:border-primary/50 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground group"
        >
          {type === "image" ? (
            <ImageIcon className="h-8 w-8 group-hover:text-primary transition-colors" />
          ) : (
            <UploadCloud className="h-8 w-8 group-hover:text-primary transition-colors" />
          )}
          <span className="text-sm font-medium group-hover:text-foreground transition-colors">
            {type === "image" ? t("uploadImage") : t("uploadFile")}
          </span>
          <span className="text-xs">
            {t("maxSizeLabel", { size: formatFileSize(maxFileSize * 1024 * 1024) })}
          </span>
        </button>
      )}
    </CldUploadWidget>
  );
}
