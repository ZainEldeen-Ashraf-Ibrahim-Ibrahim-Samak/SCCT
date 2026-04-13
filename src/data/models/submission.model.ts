import mongoose, { Schema, type Document, type Model } from "mongoose";
import { SubmissionStatus } from "@/domain/entities/submission";

export interface IAuditEntry {
  oldStatus: SubmissionStatus;
  newStatus: SubmissionStatus;
  comment?: string;
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  timestamp: Date;
}

export interface ISubmission extends Document {
  accessToken: string;
  formTemplateId: mongoose.Types.ObjectId;
  clientName: string;
  clientContact: string;
  status: SubmissionStatus;
  rewriteComment: string;
  formSnapshot: Record<string, unknown>[]; // Frozen representation of FieldDefinitions
  auditTrail: IAuditEntry[];
  submittedAt: Date;
  lastResubmittedAt?: Date | null;
  updatedAt: Date;
}

const auditEntrySchema = new Schema<IAuditEntry>(
  {
    oldStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    comment: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adminName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const formSnapshotItemSchema = new Schema<Record<string, unknown>>({}, { _id: false, strict: false });

const submissionSchema = new Schema<ISubmission>(
  {
    accessToken: { type: String, required: true, unique: true },
    formTemplateId: { type: Schema.Types.ObjectId, ref: "FormTemplate", required: true, index: true },
    clientName: { type: String, required: true, trim: true, maxlength: 200 },
    clientContact: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "viewed", "needs_rewrite"],
      default: "pending",
      required: true,
    },
    rewriteComment: { type: String, default: "" },
    formSnapshot: { type: [formSnapshotItemSchema], required: true },
    auditTrail: [auditEntrySchema],
    submittedAt: { type: Date, default: Date.now },
    lastResubmittedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "submissions",
  }
);

// Compound index for admin dashboard filtering and sorting
submissionSchema.index({ status: 1, submittedAt: -1 });

export const SubmissionModel: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", submissionSchema);
