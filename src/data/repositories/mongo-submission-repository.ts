import { SubmissionRepository } from "@/domain/repositories/submission-repository";
import { Submission, CreateSubmissionInput, UpdateSubmissionStatusInput } from "@/domain/entities/submission";
import { SubmissionModel } from "@/data/models/submission.model";
import { FieldValueModel } from "@/data/models/field-value.model";
import { destroyAssets } from "@/data/services/cloudinary-service";
import { connectToDatabase } from "@/lib/db";
import { CacheService } from "@/data/services/cache-service";
import { logger } from "@/lib/dev-logger";

function toEntity(doc: Record<string, unknown>): Submission {
  return {
    id: doc._id?.toString() ?? "",
    accessToken: doc.accessToken as string,
    formTemplateId: doc.formTemplateId?.toString() ?? "",
    clientName: doc.clientName as string,
    clientContact: doc.clientContact as string,
    status: doc.status as Submission["status"],
    rewriteComment: doc.rewriteComment as string,
    formSnapshot: (doc.formSnapshot as any) ?? [],
    auditTrail: (doc.auditTrail as any) ?? [],
    submittedAt: doc.submittedAt as Date,
    lastResubmittedAt: doc.lastResubmittedAt as Date | null,
    updatedAt: doc.updatedAt as Date,
  };
}

export class MongoSubmissionRepository implements SubmissionRepository {
  async create(input: CreateSubmissionInput, accessToken: string): Promise<Submission> {
    try {
      await connectToDatabase();
      const doc = await SubmissionModel.create({
        ...input,
        accessToken,
        status: "pending",
        auditTrail: [],
        submittedAt: new Date(),
      });
      await CacheService.invalidateSubmissionCache();
      return toEntity(doc.toObject() as unknown as Record<string, unknown>);
    } catch (error) {
      logger.error("Failed to create submission", { input, accessToken, error });
      throw error;
    }
  }

  async findById(id: string): Promise<Submission | null> {
    try {
      await connectToDatabase();
      const doc = await SubmissionModel.findById(id).lean();
      return doc ? toEntity(doc) : null;
    } catch (error) {
      logger.error("Failed to find submission by id", { id, error });
      throw error;
    }
  }

  async findByToken(accessToken: string): Promise<Submission | null> {
    try {
      return await CacheService.getSubmission(accessToken, async () => {
        await connectToDatabase();
        const doc = await SubmissionModel.findOne({ accessToken }).lean();
        return doc ? toEntity(doc) : null;
      });
    } catch (error) {
      logger.error("Failed to find submission by token", { accessToken, error });
      throw error;
    }
  }

  async findByFormId(formTemplateId: string): Promise<Submission[]> {
    try {
      await connectToDatabase();
      const docs = await SubmissionModel.find({ formTemplateId }).lean();
      return docs.map(toEntity);
    } catch (error) {
      logger.error("Failed to find submissions by form id", { formTemplateId, error });
      throw error;
    }
  }

  async listPaginated(
    page: number,
    limit: number,
    status?: string
  ): Promise<{ submissions: Submission[]; total: number; totalPages: number }> {
    try {
      const compute = async () => {
        await connectToDatabase();
        const filter = status && status !== "all" ? { status } : {};
        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
          SubmissionModel.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit).lean(),
          SubmissionModel.countDocuments(filter),
        ]);

        return {
          submissions: docs.map(toEntity),
          total,
          totalPages: Math.ceil(total / limit),
        };
      };

      if (!status || status === "all") {
        return await CacheService.getSubmissionsList("all", page, compute);
      }
      return await CacheService.getSubmissionsList(status, page, compute);
    } catch (error) {
      logger.error("Failed to list paginated submissions", { page, limit, status, error });
      throw error;
    }
  }

  async getCounts(): Promise<{ pending: number; viewed: number; needs_rewrite: number; total: number }> {
    try {
      return await CacheService.getSubmissionsCounts(async () => {
        await connectToDatabase();
        const counts = await SubmissionModel.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const result = { pending: 0, viewed: 0, needs_rewrite: 0, total: 0 };
        for (const row of counts) {
          if (row._id in result) {
            (result as any)[row._id] = row.count;
            result.total += row.count;
          }
        }
        return result;
      });
    } catch (error) {
      logger.error("Failed to get submissions counts", error);
      throw error;
    }
  }

  async updateStatus(id: string, input: UpdateSubmissionStatusInput): Promise<Submission | null> {
    try {
      await connectToDatabase();
      const submission = await SubmissionModel.findById(id);
      if (!submission) return null;

      const auditEntry = {
        oldStatus: submission.status,
        newStatus: input.status,
        comment: input.comment || "",
        adminId: input.admin.id as any,
        adminName: input.admin.name,
        timestamp: new Date(),
      };

      submission.status = input.status;
      if (input.status === "needs_rewrite") {
        submission.rewriteComment = input.comment || "";
      } else {
        submission.rewriteComment = "";
      }
      submission.auditTrail.push(auditEntry);

      await submission.save();
      const leanDoc = await SubmissionModel.findById(id).lean();
      if (leanDoc) {
        await CacheService.invalidateSubmissionCache(leanDoc.accessToken);
      }
      return leanDoc ? toEntity(leanDoc) : null;
    } catch (error) {
      logger.error("Failed to update submission status", { id, input, error });
      throw error;
    }
  }

  async resetStatusForResubmission(id: string): Promise<Submission | null> {
    try {
      await connectToDatabase();
      const doc = await SubmissionModel.findByIdAndUpdate(
        id,
        {
          status: "pending",
          rewriteComment: "",
          lastResubmittedAt: new Date(),
        },
        { new: true }
      ).lean();
      if (doc) {
        await CacheService.invalidateSubmissionCache(doc.accessToken);
      }
      return doc ? toEntity(doc) : null;
    } catch (error) {
      logger.error("Failed to reset submission status", { id, error });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const submission = await SubmissionModel.findById(id).lean();
      if (!submission) return false;

      // Destroy associated media files on Cloudinary
      const fieldValues = await FieldValueModel.find({ submissionId: id }).lean();
      const publicIds = fieldValues
        .map((fv) => fv.mediaPublicId)
        .filter((id) => typeof id === "string" && id.trim().length > 0) as string[];

      if (publicIds.length > 0) {
        try {
          await destroyAssets(publicIds);
        } catch (error) {
          logger.error("Failed to destroy Cloudinary assets during submission deletion", { id, error });
        }
      }

      // Delete field values
      await FieldValueModel.deleteMany({ submissionId: id });
      // Delete submission
      const result = await SubmissionModel.findByIdAndDelete(id);

      await CacheService.invalidateSubmissionCache(submission.accessToken);
      return !!result;
    } catch (error) {
      logger.error("Failed to delete submission", { id, error });
      throw error;
    }
  }
}
