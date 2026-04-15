import { v2 as cloudinary } from "cloudinary";
import { StorageRepository, StorageUsageMetrics } from "@/domain/repositories/storage-repository";
import { SubmissionModel } from "@/data/models/submission.model";
import { FieldValueModel } from "@/data/models/field-value.model";
import { destroyAssets } from "@/data/services/cloudinary-service";
import { connectToDatabase } from "@/lib/db";
import { logger } from "@/lib/dev-logger";

export class CloudinaryStorageRepository implements StorageRepository {
  async getUsageMetrics(): Promise<StorageUsageMetrics> {
    try {
      const result = await cloudinary.api.usage();
      
      // Cloudinary API structure for usage
      // result.storage = { usage: 12345, limit: 1048576, used_percent: 0.01 }
      // result.bandwidth = { usage: ..., limit: ..., used_percent: ... }
      // result.requests = { usage: ... }
      
      return {
        storage: {
          usage: result.storage?.usage || 0,
          limit: result.storage?.limit || 1,
          used_percent: result.storage?.used_percent || 0,
        },
        bandwidth: {
          usage: result.bandwidth?.usage || 0,
          limit: result.bandwidth?.limit || 1,
          used_percent: result.bandwidth?.used_percent || 0,
        },
        requests: result.requests?.usage || 0,
      };
    } catch (error) {
      logger.error("Failed to fetch Cloudinary usage metrics", error);
      throw error;
    }
  }

  async deleteMediaByTarget(target: "drafts" | "unused_media"): Promise<number> {
    try {
      await connectToDatabase();
      let publicIdsToDelete: string[] = [];

      if (target === "drafts") {
        // Find all submissions that are in 'draft' status
        const draftSubmissions = await SubmissionModel.find({ status: "draft" }).lean();
        const draftIds = draftSubmissions.map((s) => s._id?.toString());
        
        if (draftIds.length > 0) {
          // Find all field values associated with these drafts
          const fieldValues = await FieldValueModel.find({ 
            submissionId: { $in: draftIds },
            mediaPublicId: { $exists: true, $ne: "" }
          }).lean();
          
          publicIdsToDelete = fieldValues
            .map(fv => fv.mediaPublicId)
            .filter((id): id is string => typeof id === "string" && id.length > 0);
        }
      } else if (target === "unused_media") {
        // Implementation for unused media would require comparing all cloudinary assets against all FieldValue.mediaPublicId
        // This is complex and expensive, so for now we'll log it as not fully implemented or implement a simple version
        logger.warn("Target 'unused_media' cleanup is currently a no-op as it requires full sync");
        return 0;
      }

      if (publicIdsToDelete.length > 0) {
        // Batch delete
        await destroyAssets(publicIdsToDelete);
        logger.info(`Deleted ${publicIdsToDelete.length} Cloudinary assets for target: ${target}`);
        return publicIdsToDelete.length;
      }

      return 0;
    } catch (error) {
      logger.error(`Failed to delete media for target: ${target}`, error);
      throw error;
    }
  }
}
