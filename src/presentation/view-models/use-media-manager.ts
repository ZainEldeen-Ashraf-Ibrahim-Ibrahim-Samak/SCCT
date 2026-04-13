import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface MediaResource {
  public_id: string;
  format: string;
  version: number;
  resource_type: string;
  type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  url: string;
  secure_url: string;
}

export function useMediaManager() {
  const [resources, setResources] = useState<MediaResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchMedia = useCallback(async (cursor?: string) => {
    try {
      cursor ? setIsPaginating(true) : setIsLoading(true);
      const url = cursor ? `/api/admin/media?cursor=${encodeURIComponent(cursor)}` : "/api/admin/media";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load media");
      const json = await res.json();
      
      if (!json.success) throw new Error(json.error);
      
      if (cursor) {
        setResources(prev => [...prev, ...json.data.resources]);
      } else {
        setResources(json.data.resources);
      }
      
      setNextCursor(json.data.next_cursor || null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
      setIsPaginating(false);
    }
  }, []);

  const loadMore = () => {
    if (nextCursor) {
      fetchMedia(nextCursor);
    }
  };

  const deleteMedia = async (publicId: string) => {
    if (!confirm("Are you sure you want to delete this media file? It will be permanently removed.")) return;
    
    const toastId = toast.loading("Deleting media...");
    try {
      const res = await fetch(`/api/admin/media?publicId=${encodeURIComponent(publicId)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Delete failed");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setResources(prev => prev.filter(r => r.public_id !== publicId));
      toast.success("Media deleted", { id: toastId });
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return {
    resources,
    isLoading,
    isPaginating,
    hasMore: !!nextCursor,
    loadMore,
    deleteMedia,
    refresh: () => fetchMedia()
  };
}
