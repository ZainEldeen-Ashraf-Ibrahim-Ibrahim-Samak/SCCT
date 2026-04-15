"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, File, X, UploadCloud, GripVertical, Plus } from "lucide-react";
import Image from "next/image";
import { formatFileSize } from "@/lib/utils";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/dev-logger";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

interface MediaItem {
  url: string;
  publicId: string;
}

interface SortableItemProps {
  item: MediaItem;
  type: "image" | "file";
  disabled?: boolean;
  onRemove: (publicId: string) => void;
}

function SortableMediaItem({ item, type, disabled, onRemove }: SortableItemProps) {
  const tc = useTranslations("common");
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging
  } = useSortable({ id: item.publicId });

  return (
    <div
      ref={setNodeRef}
      className={`relative group rounded-lg border bg-card overflow-hidden w-full aspect-square shadow-sm transition-shadow hover:shadow-md ${isDragging ? "opacity-50 z-10" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 inset-s-1 z-10 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {type === "image" ? (
        <div className="relative h-full w-full">
          <Image
            src={item.url}
            alt="Uploaded item"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 150px, 160px"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-2 text-center gap-2">
          <File className="h-8 w-8 text-primary/60" />
          <p className="text-[10px] font-medium truncate w-full px-1">
            {item.url.split("/").pop()}
          </p>
        </div>
      )}

      {!disabled && (
        <button
          type="button"
          className="absolute top-1 inset-e-1 h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl z-50 hover:bg-red-700 active:scale-90"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClickCapture={(e) => {
            e.stopPropagation();
            onRemove(item.publicId);
          }}
          title={tc("delete")}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface MediaUploadProps {
  inputId?: string;
  type: "image" | "file";
  isMultiple?: boolean;
  currentUrl?: string | null;
  currentItems?: MediaItem[];
  onUpload: (url: string, publicId: string) => void;
  onItemsChange?: (items: MediaItem[]) => void;
  onRemove: () => void;
  maxFileSize?: number; // In MB
  disabled?: boolean;
}

export function MediaUpload({
  inputId,
  type,
  isMultiple = false,
  currentUrl,
  currentItems = [],
  onUpload,
  onItemsChange,
  onRemove,
  maxFileSize = 10,
  disabled = false,
}: MediaUploadProps) {
  const t = useTranslations("client");
  const tc = useTranslations("common");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleFiles = async (incomingFiles: FileList | File[]) => {
    if (disabled || isUploading) return;
    const files = Array.from(incomingFiles);
    if (files.length === 0) return;

    const selectedFiles = isMultiple ? files : files.slice(0, 1);
    const maxBytes = maxFileSize * 1024 * 1024;
    const uploadedItems: MediaItem[] = [];
    let hasUploadFailure = false;

    if (!mountedRef.current) return;
    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        if (file.size > maxBytes) {
          toast.error(t("fileTooLarge", { maxSize: formatFileSize(maxBytes) }));
          hasUploadFailure = true;
          continue;
        }

        if (type === "image" && !file.type.startsWith("image/")) {
          toast.error(t("invalidFileType"));
          hasUploadFailure = true;
          continue;
        }

        const signRes = await fetch("/api/cloudinary/sign", {
          method: "POST",
          body: JSON.stringify({
            folder: "submissions",
            timestamp: Math.round(new Date().getTime() / 1000)
          }),
        });

        const signData = await signRes.json();
        if (!signRes.ok || !signData.success) {
          throw new Error("Failed to get upload signature");
        }

        const { signature, timestamp: signedTimestamp, apikey, cloudname } = signData.data;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apikey);
        formData.append("timestamp", signedTimestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", "submissions");

        const resourceType = type === "image" ? "image" : "auto";
        const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudname}/${resourceType}/upload`;

        setUploadProgress(0);

        const data: any = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", cloudUrl);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && mountedRef.current) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setUploadProgress(percent);
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch (e) {
                resolve(xhr.responseText);
              }
            } else {
              try {
                reject(JSON.parse(xhr.responseText));
              } catch (e) {
                reject(new Error(xhr.responseText));
              }
            }
          };
          xhr.onerror = () => reject(new Error("Network Error"));
          xhr.send(formData);
        });

        if (data.error) {
          logger.error("Cloudinary upload error", data);
          toast.error(data.error?.message || t("uploadError"));
          hasUploadFailure = true;
          continue;
        }

        const resultUrl = data.secure_url;
        const resultPublicId = data.public_id;

        if (isMultiple) {
          uploadedItems.push({ url: resultUrl, publicId: resultPublicId });
        } else {
          onUpload(resultUrl, resultPublicId);
        }
      }

      if (isMultiple && uploadedItems.length > 0) {
        onItemsChange?.([...currentItems, ...uploadedItems]);
      }

      if (uploadedItems.length > 0 || (!isMultiple && !hasUploadFailure)) {
        toast.success(t("uploadSuccess"));
      }
    } catch (err) {
      logger.error("Upload error", err);
      toast.error(t("uploadError"));
    } finally {
      if (mountedRef.current) {
        setIsUploading(false);
      }
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled || isUploading) return;
    if (e.target.files && e.target.files.length > 0) {
      void handleFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleRemoveItem = (publicId: string) => {
    onItemsChange?.(currentItems.filter(item => item.publicId !== publicId));
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentItems.findIndex(i => i.publicId === active.id);
      const newIndex = currentItems.findIndex(i => i.publicId === over.id);
      if (onItemsChange) {
        onItemsChange(arrayMove(currentItems, oldIndex, newIndex));
      }
    }
  }, [currentItems, onItemsChange]);

  if (isMultiple) {
    return (
      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentItems.map(i => i.publicId)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentItems.map((item) => (
                <SortableMediaItem
                  key={item.publicId}
                  item={item}
                  type={type}
                  disabled={disabled}
                  onRemove={handleRemoveItem}
                />
              ))}

              {!disabled && (
                <div
                  className="relative aspect-square sm:w-40 sm:h-40"
                  onDragEnter={onDrag}
                  onDragOver={onDrag}
                  onDragLeave={onDrag}
                  onDrop={onDrop}
                >
                  <input
                    id={inputId}
                    title={t("addMore")}
                    type="file"
                    multiple={isMultiple}
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                    accept={type === "image" ? "image/*" : undefined}
                    capture={type === "image" ? "environment" : undefined}
                  />
                  <div className={`
                    border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 
                    text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-all h-full
                    ${dragActive ? "border-primary bg-primary/5" : ""}
                    ${isUploading ? "opacity-50" : ""}
                  `}>
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 w-full px-4">
                        <UploadCloud className="h-6 w-6 animate-bounce text-primary" />
                        <progress
                          max={100}
                          value={uploadProgress}
                          className="w-full h-1.5 overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
                        />
                        <span className="text-xs font-medium text-primary">{uploadProgress}%</span>
                      </div>
                    ) : (
                      <>
                        <Plus className="h-6 w-6" />
                        <span className="text-xs font-medium">{t("addMore")}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>

        {currentItems.length === 0 && !disabled && (
          <p className="text-sm text-muted-foreground italic">{t("noFilesUploaded")}</p>
        )}
      </div>
    );
  }

  if (currentUrl) {
    return (
      <div className="relative group rounded-lg border bg-muted/30 overflow-hidden w-fit max-w-full">
        {type === "image" ? (
          <div className="relative h-48 w-48 sm:h-64 sm:w-64">
            <Image src={currentUrl} alt="Upload" fill className="object-cover" sizes="(max-width: 768px) 100vw, 256px" />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 min-w-50">
            <File className="h-8 w-8 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{currentUrl.split("/").pop()}</p>
              <a href={currentUrl} className="text-xs text-primary hover:underline">
                {tc("download")}
              </a>
            </div>
          </div>
        )}
        {!disabled && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-9999">
            <div className="relative">
              <input
                id={inputId}
                type="file"
                title={tc("edit")}
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isUploading}
                accept={type === "image" ? "image/*" : undefined}
                capture={type === "image" ? "environment" : undefined}
              />
              <Button type="button" size="sm" variant="secondary" className="gap-2 shadow-xl whitespace-nowrap">
                <UploadCloud className="h-4 w-4" />
                {tc("edit")}
              </Button>
            </div>
            
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="gap-2 shadow-xl whitespace-nowrap"
              onPointerDownCapture={(e) => e.stopPropagation()}
              onClickCapture={(e) => {
                logger.info("Removing single media");
                e.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-4 w-4" />
              {tc("delete")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative w-full sm:w-auto overflow-hidden"
      onDragEnter={onDrag}
      onDragOver={onDrag}
      onDragLeave={onDrag}
      onDrop={onDrop}
    >
      <input
        id={inputId}
        title={t("addMore")}
        type="file"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={disabled || isUploading}
        accept={type === "image" ? "image/*" : undefined}
        capture={type === "image" ? "environment" : undefined}
      />
      <div
        className={`
          w-full sm:min-w-60 h-32 px-8 border-2 border-dashed rounded-xl transition-all 
          hover:border-primary/50 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 
          text-muted-foreground group
          ${dragActive ? "border-primary bg-primary/5 ring-4 ring-primary/10" : ""}
          ${isUploading ? "opacity-50" : ""}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-3 w-full max-w-50">
            <UploadCloud className="h-8 w-8 animate-bounce text-primary" />
            <progress
              max={100}
              value={uploadProgress}
              className="w-full h-2 overflow-hidden rounded-full shadow-inner [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
            />
            <span className="text-sm font-semibold text-primary">{uploadProgress}%</span>
          </div>
        ) : (
          <>
            {type === "image" ? <ImageIcon className="h-8 w-8 group-hover:scale-110 transition-transform" /> : <UploadCloud className="h-8 w-8 group-hover:scale-110 transition-transform" />}
            <span className="text-sm font-medium">
              {dragActive ? t("dropToUpload") : (type === "image" ? t("uploadImage") : t("uploadFile"))}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
