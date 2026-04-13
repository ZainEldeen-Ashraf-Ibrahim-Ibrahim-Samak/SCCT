"use client";

import { useMediaManager } from "@/presentation/view-models/use-media-manager";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ExternalLink, Image as ImageIcon, File } from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";

export function MediaGallery() {
  const { resources, isLoading, isPaginating, hasMore, loadMore, deleteMedia, refresh } = useMediaManager();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024, dm = 2, sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Media Manager</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Browse and manage all uploaded assets in the Cloudinary storage.
          </p>
        </div>
        <Button variant="outline" onClick={refresh}>Refresh</Button>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 border border-dashed rounded-xl">
          <p className="text-muted-foreground">No media files found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {resources.map((res) => (
            <Card key={res.public_id} className="relative group overflow-hidden border-zinc-200 dark:border-zinc-800">
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center relative">
                {res.resource_type === "image" ? (
                  <Image 
                    src={res.secure_url} 
                    alt={res.public_id} 
                    fill 
                    className="object-cover" 
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <File className="w-12 h-12 text-zinc-400" />
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <a href={res.secure_url} target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-sm transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => deleteMedia(res.public_id)}
                    className="bg-red-500/80 hover:bg-red-600 p-2 rounded-full text-white backdrop-blur-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium truncate" title={res.public_id}>
                  {res.public_id.split("/").pop()}
                </p>
                <div className="flex justify-between items-center mt-1 text-[10px] text-zinc-500">
                  <span className="uppercase">{res.format}</span>
                  <span>{formatBytes(res.bytes)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-8 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="secondary" onClick={loadMore} disabled={isPaginating}>
            {isPaginating ? "Loading..." : "Load Older Files"}
          </Button>
        </div>
      )}
    </div>
  );
}
