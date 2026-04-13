import { FieldDefinitionRepository } from "@/domain/repositories/field-definition-repository";
import {
  FieldDefinition,
  CreateFieldDefinitionInput,
  UpdateFieldDefinitionInput,
  ReorderFieldInput,
} from "@/domain/entities/field-definition";
import { FieldDefinitionModel } from "@/data/models/field-definition.model";
import { connectToDatabase } from "@/lib/db";
import { CacheService } from "@/data/services/cache-service";

function toEntity(doc: Record<string, unknown>): FieldDefinition {
  return {
    id: doc._id?.toString() ?? "",
    formTemplateId: doc.formTemplateId?.toString() ?? "",
    nameEn: doc.nameEn as string,
    nameAr: doc.nameAr as string,
    inputType: doc.inputType as FieldDefinition["inputType"],
    validationRules: (doc.validationRules as FieldDefinition["validationRules"]) ?? {},
    isMultiple: (doc.isMultiple as boolean) ?? false,
    dropdownOptionsEn: (doc.dropdownOptionsEn as string[]) ?? [],
    dropdownOptionsAr: (doc.dropdownOptionsAr as string[]) ?? [],
    sortOrder: doc.sortOrder as number,
    isActive: doc.isActive as boolean,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

export class MongoFieldDefinitionRepository implements FieldDefinitionRepository {
  async create(input: CreateFieldDefinitionInput): Promise<FieldDefinition> {
    await connectToDatabase();
    const doc = await FieldDefinitionModel.create(input);
    await CacheService.invalidateFieldsCache(input.formTemplateId);
    return toEntity(doc.toObject() as unknown as Record<string, unknown>);
  }

  async findById(id: string): Promise<FieldDefinition | null> {
    await connectToDatabase();
    const doc = await FieldDefinitionModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByFormId(formTemplateId: string, includeInactive = false): Promise<FieldDefinition[]> {
    const compute = async () => {
      await connectToDatabase();
      const filter: Record<string, unknown> = { formTemplateId };
      if (!includeInactive) {
        filter.isActive = true;
      }
      const docs = await FieldDefinitionModel.find(filter)
        .sort({ sortOrder: 1 })
        .lean();
      return docs.map(toEntity);
    };

    if (includeInactive) {
      return compute();
    }
    return CacheService.getFields(formTemplateId, compute);
  }

  async update(id: string, input: UpdateFieldDefinitionInput): Promise<FieldDefinition | null> {
    await connectToDatabase();
    const doc = await FieldDefinitionModel.findByIdAndUpdate(id, input, { new: true }).lean();
    if (doc) {
      await CacheService.invalidateFieldsCache(doc.formTemplateId.toString());
    }
    return doc ? toEntity(doc) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    await connectToDatabase();
    const doc = await FieldDefinitionModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).lean();
    if (doc) {
      await CacheService.invalidateFieldsCache(doc.formTemplateId.toString());
    }
    return !!doc;
  }

  async reorder(formTemplateId: string, fields: ReorderFieldInput[]): Promise<void> {
    await connectToDatabase();
    const bulkOps = fields.map((f) => ({
      updateOne: {
        filter: { _id: f.fieldId },
        update: { $set: { sortOrder: f.sortOrder } },
      },
    }));
    await FieldDefinitionModel.bulkWrite(bulkOps);
    await CacheService.invalidateFieldsCache(formTemplateId);
  }

  async getNextSortOrder(formTemplateId: string): Promise<number> {
    await connectToDatabase();
    const lastField = await FieldDefinitionModel.findOne({ formTemplateId })
      .sort({ sortOrder: -1 })
      .lean();
    return lastField ? (lastField.sortOrder as number) + 1 : 0;
  }
}
