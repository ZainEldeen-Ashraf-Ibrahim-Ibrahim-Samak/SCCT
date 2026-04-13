"use client";

import { useTranslations } from "next-intl";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, File, X, UploadCloud, GripVertical, Plus } from "lucide-react";
import Image from "next/image";
import { formatFileSize } from "@/lib/utils";
import { useState, useCallback } from "react";
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
import { CSS } from "@dnd-kit/utilities";

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.publicId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative group rounded-lg border bg-card overflow-hidden w-full aspect-square sm:w-40 sm:h-40 shadow-sm transition-shadow hover:shadow-md"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-1 left-1 z-10 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
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
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onClick={() => onRemove(item.publicId)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

interface MediaUploadProps {
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
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSuccess = (result: any) => {
    if (result?.info && typeof result.info !== "string" && result.info.secure_url) {
      if (isMultiple) {
        const newItem = { url: result.info.secure_url, publicId: result.info.public_id || "" };
        onItemsChange?.([...currentItems, newItem]);
      } else {
        onUpload(result.info.secure_url, result.info.public_id ?? "");
      }
      toast.success(t("uploadSuccess"));
    }
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

  const uploadOptions = {
    multiple: isMultiple,
    maxFiles: isMultiple ? 10 : 1,
    maxFileSize: maxFileSize * 1024 * 1024,
    resourceType: type === "image" ? "image" : "auto",
    clientAllowedFormats: type === "image" ? ["png", "jpg", "jpeg", "webp"] : undefined,
  };

  // Multiple view
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
                <CldUploadWidget
                  signatureEndpoint="/api/cloudinary/sign"
                  options={uploadOptions}
                  onSuccess={handleSuccess}
                  onError={() => toast.error(t("uploadError"))}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors h-full aspect-square sm:w-40 sm:h-40"
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-xs font-medium">{t("addMore")}</span>
                    </button>
                  )}
                </CldUploadWidget>
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

  // Single view (mostly unchanged logic but simplified)
  if (currentUrl) {
    return (
      <div className="relative group rounded-lg border bg-muted/30 overflow-hidden w-fit max-w-full">
        {type === "image" ? (
          <div className="relative h-48 w-48 sm:h-64 sm:w-64">
            <Image src={currentUrl} alt="Upload" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 min-w-[200px]">
            <File className="h-8 w-8 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{currentUrl.split("/").pop()}</p>
              <a href={currentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
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
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <CldUploadWidget
      signatureEndpoint="/api/cloudinary/sign"
      options={uploadOptions}
      onSuccess={handleSuccess}
      onError={() => toast.error(t("uploadError"))}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          disabled={disabled}
          className="w-full sm:w-auto h-32 px-8 border-2 border-dashed rounded-xl transition-colors hover:border-primary/50 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground group"
        >
          {type === "image" ? <ImageIcon className="h-8 w-8" /> : <UploadCloud className="h-8 w-8" />}
          <span className="text-sm font-medium">{type === "image" ? t("uploadImage") : t("uploadFile")}</span>
        </button>
      )}
    </CldUploadWidget>
  );
}
