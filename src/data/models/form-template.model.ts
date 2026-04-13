import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IFormTemplate extends Document {
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
