import { readdir, stat, unlink } from "fs/promises";
import path from "path";

export class ManageMediaUseCase {
  private uploadsDir = path.join(process.cwd(), "public", "uploads");

  async getMediaFiles(nextCursor?: string, maxResults = 30) {
    try {
      const files = await readdir(this.uploadsDir);
      
      // Filter for files and get stats
      const fileData = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.uploadsDir, file);
          const s = await stat(filePath);
          const ext = path.extname(file).slice(1).toLowerCase();
          const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
          return {
            public_id: file,
            secure_url: `/uploads/${file}`,
            created_at: s.mtime.toISOString(),
            bytes: s.size,
            format: ext,
            resource_type: isImage ? "image" : "raw",
            width: 0,
            height: 0
          };
        })
      );

      // Sort by latest first
      fileData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Simple pagination
      const start = nextCursor ? parseInt(nextCursor) : 0;
      const paginated = fileData.slice(start, start + maxResults);
      const next = start + maxResults < fileData.length ? (start + maxResults).toString() : null;

      return {
        resources: paginated,
        next_cursor: next
      };
    } catch (error) {
      console.error("Failed to fetch local media files", error);
      return { resources: [], next_cursor: null };
    }
  }

  async deleteMediaFile(publicId: string) {
    try {
      const filePath = path.join(this.uploadsDir, publicId);
      await unlink(filePath);
      return { result: "ok" };
    } catch (error) {
      console.error(`Failed to delete local media file: ${publicId}`, error);
      throw error;
    }
  }
}
