import { Submission, CreateSubmissionInput, UpdateSubmissionStatusInput } from "@/domain/entities/submission";

/**
 * Submission repository interface.
 * Domain layer — defines data access contract.
 */
export interface SubmissionRepository {
  create(input: CreateSubmissionInput, accessToken: string): Promise<Submission>;
  findById(id: string): Promise<Submission | null>;
  findByToken(accessToken: string): Promise<Submission | null>;
  findByFormId(formTemplateId: string): Promise<Submission[]>;
  listPaginated(
    page: number,
    limit: number,
    status?: string
  ): Promise<{ submissions: Submission[]; total: number; totalPages: number }>;
  getCounts(): Promise<{ pending: number; viewed: number; needs_rewrite: number; total: number }>;
  updateStatus(id: string, input: UpdateSubmissionStatusInput): Promise<Submission | null>;
  resetStatusForResubmission(id: string): Promise<Submission | null>;
  delete(id: string): Promise<boolean>;
}
