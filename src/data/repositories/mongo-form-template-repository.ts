import { FormTemplateRepository } from "@/domain/repositories/form-template-repository";
import { FormTemplate, CreateFormTemplateInput, UpdateFormTemplateInput } from "@/domain/entities/form-template";
import { FormTemplateModel } from "@/data/models/form-template.model";
import { connectToDatabase } from "@/lib/db";
import { CacheService } from "@/data/services/cache-service";
import mongoose from "mongoose";

function toEntity(doc: Record<string, unknown>): FormTemplate {
  return {
    id: doc._id?.toString() ?? "",
    name: doc.name as string,
    description: (doc.description as string) ?? "",
    isActive: doc.isActive as boolean,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

export class MongoFormTemplateRepository implements FormTemplateRepository {
  async create(input: CreateFormTemplateInput): Promise<FormTemplate> {
    await connectToDatabase();
    const doc = await FormTemplateModel.create({
      name: input.name,
      description: input.description ?? "",
      isActive: true,
    });
    await CacheService.invalidateFormCache();
    return toEntity(doc.toObject() as unknown as Record<string, unknown>);
  }

  async findById(id: string): Promise<FormTemplate | null> {
    await connectToDatabase();
    const doc = await FormTemplateModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findActive(): Promise<FormTemplate | null> {
    return CacheService.getActiveForm(async () => {
      await connectToDatabase();
      const doc = await FormTemplateModel.findOne({ isActive: true }).lean();
      return doc ? toEntity(doc) : null;
    });
  }

  async findAll(): Promise<FormTemplate[]> {
    await connectToDatabase();
    const docs = await FormTemplateModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(toEntity);
  }

  async update(id: string, input: UpdateFormTemplateInput): Promise<FormTemplate | null> {
    await connectToDatabase();
    const doc = await FormTemplateModel.findByIdAndUpdate(id, input, { new: true }).lean();
    await CacheService.invalidateFormCache();
    return doc ? toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await FormTemplateModel.findByIdAndDelete(id);
    await CacheService.invalidateFormCache();
    return !!result;
  }

  async deactivateAll(): Promise<void> {
    await connectToDatabase();
    await FormTemplateModel.updateMany({}, { isActive: false });
    await CacheService.invalidateFormCache();
  }

  async countSubmissions(formTemplateId: string): Promise<number> {
    await connectToDatabase();
    const SubmissionModel = mongoose.models.Submission;
    if (!SubmissionModel) return 0;
    return SubmissionModel.countDocuments({ formTemplateId });
  }
}
