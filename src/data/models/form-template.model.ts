import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IFormTemplate extends Document {
  name: string;
  description: string;
  contactRecords: Array<{
    id: string;
    name: string;
    contact?: string;
    role?: string;
    notes?: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const contactRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    contact: { type: String, default: "", trim: true, maxlength: 200 },
    role: { type: String, default: "", trim: true, maxlength: 100 },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const formTemplateSchema = new Schema<IFormTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    contactRecords: {
      type: [contactRecordSchema],
      default: [{ id: "primary", name: "Primary Contact", contact: "", role: "", notes: "" }],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "form_templates",
  }
);

export const FormTemplateModel: Model<IFormTemplate> =
  mongoose.models.FormTemplate ||
  mongoose.model<IFormTemplate>("FormTemplate", formTemplateSchema);
