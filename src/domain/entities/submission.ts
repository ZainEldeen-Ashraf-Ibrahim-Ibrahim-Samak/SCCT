import { FieldDefinition } from "./field-definition";
import { User } from "./user";

/**
 * Submission entity interface.
 * Domain layer — zero framework imports.
 */

export type SubmissionStatus = "pending" | "viewed" | "needs_rewrite";

export interface AuditEntry {
  oldStatus: SubmissionStatus;
  newStatus: SubmissionStatus;
  comment?: string;
  adminId: string;
  adminName: string;
  timestamp: Date;
}

export interface Submission {
  id: string;
  accessToken: string;
  formTemplateId: string;
  clientName: string;
  clientContact: string;
  status: SubmissionStatus;
  rewriteComment: string;
  formSnapshot: ReadonlyArray<FieldDefinition>;
  auditTrail: AuditEntry[];
  submittedAt: Date;
  lastResubmittedAt?: Date | null;
  updatedAt: Date;
}

export type CreateSubmissionInput = Pick<
  Submission,
  "clientName" | "clientContact" | "formTemplateId" | "formSnapshot"
>;

export type UpdateSubmissionStatusInput = {
  status: SubmissionStatus;
  comment?: string;
  admin: Pick<User, "id" | "name">;
};
