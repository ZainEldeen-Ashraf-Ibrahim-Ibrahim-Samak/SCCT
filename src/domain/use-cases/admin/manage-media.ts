import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env.mjs";

export class ManageMediaUseCase {
  async getMediaFiles(nextCursor?: string, maxResults = 30) {
    if (!env.CLOUDINARY_API_KEY) throw new Error("Cloudinary not configured");
    
    // Cloudinary admin API is required to list resources
    const options: any = {
      type: "upload",
      max_results: maxResults,
      direction: "desc", // Latest first
    };

    if (nextCursor) {
      options.next_cursor = nextCursor;
    }

    return new Promise((resolve, reject) => {
      cloudinary.api.resources(options, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  async deleteMediaFile(publicId: string) {
    if (!env.CLOUDINARY_API_KEY) throw new Error("Cloudinary not configured");
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }
}
