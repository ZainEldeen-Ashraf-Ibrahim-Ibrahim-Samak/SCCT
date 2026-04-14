# Research: Regex Field Validation

## Decisions
- **Regex Enforcement**: Validation will be handled using `Zod` schema refinements where possible, and manual regex checks in the `ViewModel` layer for dynamic fields.
- **Dynamic Field Storage**: The `IFieldDefinition` model will be extended to include `regex`, `regexErrorEn`, and `regexErrorAr`.
- **Phone Validation**: The Egyptian phone regex will be standardized as `^(010|011|012|015)[0-9]{8}$` for mobile and standard local formats for landlines.

## Rationale
- Using a centralized regex registry reduces duplication and ensures that Egyptian phone validation is consistent across and Team management, Login, and Submissions.
- Extending `FieldDefinition` allows admins to define validation rules at runtime without code changes, fulfilling Principle III (Dynamic Schema Design).

## Alternatives Considered
- **Client-only validation**: Rejected. Server-side validation is required for data integrity (Principle VII).
- **Hardcoded validation in components**: Rejected. Violates Principle I (Clean Architecture) and III (Dynamic Schema).

## Targeted Files
- `src/data/models/field-definition.model.ts`: Extend schema with validation fields.
- `src/app/[locale]/admin/(authenticated)/team/team-client.tsx`: Update `Zod` schema for members.
- `src/app/[locale]/admin/login/page.tsx`: Add pre-submit validation for email.
- `src/presentation/view-models/submission.view-model.ts` (hypothetical, need to verify name): Update for dynamic validation.

## Open Questions Resolved
- **International format**: User confirmed "B - Egypt" (Regional enforcement).
