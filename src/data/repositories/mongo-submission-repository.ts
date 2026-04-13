import { SubmissionRepository } from "@/domain/repositories/submission-repository";
import { Submission, CreateSubmissionInput, UpdateSubmissionStatusInput } from "@/domain/entities/submission";
import { SubmissionModel } from "@/data/models/submission.model";
import { FieldValueModel } from "@/data/models/field-value.model";
import { destroyAssets } from "@/data/services/cloudinary-service";
import { connectToDatabase } from "@/lib/db";
import { CacheService } from "@/data/services/cache-service";

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
    await connectToDatabase();
    const doc = await SubmissionModel.create({
      ...input,
      accessToken,
      status: "pending",
      auditTrail: [],
      submittedAt: new Date(),
    });
    await CacheService.invalidateSubmissionCache();
    return toEntity(doc.toObject());
  }

  async findById(id: string): Promise<Submission | null> {
    await connectToDatabase();
    const doc = await SubmissionModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByToken(accessToken: string): Promise<Submission | null> {
    return CacheService.getSubmission(accessToken, async () => {
      await connectToDatabase();
      const doc = await SubmissionModel.findOne({ accessToken }).lean();
      return doc ? toEntity(doc) : null;
    });
  }

  async findByFormId(formTemplateId: string): Promise<Submission[]> {
    await connectToDatabase();
    const docs = await SubmissionModel.find({ formTemplateId }).lean();
    return docs.map(toEntity);
  }

  async listPaginated(
    page: number,
    limit: number,
    status?: string
  ): Promise<{ submissions: Submission[]; total: number; totalPages: number }> {
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
        return CacheService.getSubmissionsList("all", page, compute);
    }
    return CacheService.getSubmissionsList(status, page, compute);
  }

  async getCounts(): Promise<{ pending: number; viewed: number; needs_rewrite: number; total: number }> {
    return CacheService.getSubmissionsCounts(async () => {
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
  }

  async updateStatus(id: string, input: UpdateSubmissionStatusInput): Promise<Submission | null> {
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
    await CacheService.invalidateSubmissionCache(leanDoc!.accessToken);
    return toEntity(leanDoc!);
  }

  async resetStatusForResubmission(id: string): Promise<Submission | null> {
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
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const submission = await SubmissionModel.findById(id).lean();
    if (!submission) return false;

    // Destroy associated media files on Cloudinary
    const fieldValues = await FieldValueModel.find({ submissionId: id }).lean();
    const publicIds = fieldValues
      .map((fv) => fv.mediaPublicId)
      .filter((id) => typeof id === "string" && id.trim().length > 0) as string[];

    if (publicIds.length > 0) {
      await destroyAssets(publicIds).catch(console.error); // Best effort
    }

    // Delete field values
    await FieldValueModel.deleteMany({ submissionId: id });
    // Delete submission
    const result = await SubmissionModel.findByIdAndDelete(id);

    await CacheService.invalidateSubmissionCache(submission.accessToken);
    return !!result;
  }
}
