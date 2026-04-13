# Tasks: Fix Submission Form Sync

**Input**: Design documents from `specs/007-fix-submission-form-sync/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No explicit TDD request in spec; dedicated test-writing tasks are omitted. Verification tasks are included in the final phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared UI/text primitives needed across story implementation.

- [X] T001 Create reusable site-name element with canonical value in `src/components/shared/site-name.tsx`
- [X] T002 Add new shared UX translation keys for contact records, reconciliation warnings, and notification states in `src/messages/en.json`
- [X] T003 [P] Mirror the new translation keys in `src/messages/ar.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema and contract updates that must exist before story-level behavior is implemented.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [X] T004 Extend submission payload validation for `contactRecords` minimum cardinality and multi-select array values in `src/lib/validations.ts`
- [X] T005 Update shared domain entity types for submission/request lifecycle and multi-value field support in `src/domain/entities/submission.ts` and `src/domain/entities/field-value.ts`
- [X] T006 Extend persistence schemas for contact records and resubmission request metadata in `src/data/models/submission.model.ts` and `src/data/models/field-value.model.ts`
- [X] T007 Update repository/cache contracts to support new submission metadata and invalidation behavior in `src/domain/repositories/submission-repository.ts`, `src/data/repositories/mongo-submission-repository.ts`, and `src/data/services/cache-service.ts`

**Checkpoint**: Foundation ready - user stories can now be implemented.

---

## Phase 3: User Story 1 - Manage Contact Records (Priority: P1) 🎯 MVP

**Goal**: Allow users to edit/add/delete contact records while enforcing a minimum of one record.

**Independent Test**: Open token submission form, edit a contact record, add another, delete one, and confirm deleting the last remaining record is blocked.

### Implementation for User Story 1

- [X] T008 [P] [US1] Add contact-record draft state/actions (`add`, `edit`, `delete`, min-one guard) in `src/presentation/view-models/use-submission.ts`
- [X] T009 [P] [US1] Create repeatable contact-record editor UI component in `src/presentation/components/client/submission-form/contact-records.tsx`
- [X] T010 [US1] Integrate contact-record editor and inline validation into submission page in `src/presentation/components/client/submission-form/index.tsx`
- [X] T011 [US1] Include `contactRecords` in submit/resubmit payload mapping in `src/presentation/view-models/use-submission.ts`
- [X] T012 [US1] Enforce `contactRecords.length >= 1` in token submission API handling in `src/app/api/submissions/[token]/route.ts` and `src/domain/use-cases/client/submit-form.ts`
- [X] T013 [US1] Hydrate persisted contact records back into client draft state on reload in `src/domain/use-cases/client/view-submission.ts` and `src/presentation/view-models/use-submission.ts`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Receive Resubmission Notifications (Priority: P1)

**Goal**: Ensure admin resubmission requests are delivered to the correct user and remain visible to admin on revisit, with 7-day offline pending retention.

**Independent Test**: Admin marks a submission as `needs_rewrite` with comment, target user sees notification, and admin reopening the same submission sees persisted request status.

### Implementation for User Story 2

- [X] T014 [P] [US2] Add resubmission request lifecycle fields and status mapping in `src/data/models/submission.model.ts`
- [X] T015 [US2] Persist and update resubmission request visibility/delivery state in `src/data/repositories/mongo-submission-repository.ts`
- [X] T016 [US2] Emit user-targeted status-change notifications from admin status updates in `src/app/api/admin/submissions/[id]/route.ts` and `src/lib/events/publisher.ts`
- [X] T017 [US2] Expose durable pending notification state with 7-day retention logic in `src/app/api/submissions/[token]/events/route.ts`
- [X] T018 [US2] Surface user notification receipt and status messaging in `src/presentation/view-models/use-submission.ts` and `src/presentation/components/client/submission-form/index.tsx`
- [X] T019 [US2] Show persisted resubmission request status in admin revisit view in `src/presentation/components/admin/submission-review/index.tsx`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Load Latest Form for Token Users (Priority: P2)

**Goal**: On refresh, token users always load latest form structure, keep matching unsaved values, and receive warning for dropped values.

**Independent Test**: Open token form, enter unsaved values, reorder/update fields as admin, refresh token page, and verify latest structure with carry-over + dropped-values warning.

### Implementation for User Story 3

- [X] T020 [US3] Add latest-form refresh fetch flow and version comparison guards in `src/presentation/view-models/use-submission.ts`
- [X] T021 [US3] Implement field-level draft reconciliation and dropped-field collection in `src/presentation/view-models/use-submission.ts`
- [X] T022 [US3] Render localized dropped-values warning banner on refresh in `src/presentation/components/client/submission-form/index.tsx`
- [X] T023 [US3] Invalidate/reload field-definition caches after reorder updates in `src/app/api/admin/fields/reorder/route.ts` and `src/data/services/cache-service.ts`
- [X] T024 [US3] Return latest published field ordering/version payload for token refresh consumers in `src/domain/use-cases/client/view-submission.ts` and `src/app/api/submissions/[token]/route.ts`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: User Story 4 - Multi-Select Sector and Unified Site Name (Priority: P3)

**Goal**: Support multi-select sector values in submissions and standardize all site-name displays through shared `SCCT` element.

**Independent Test**: Submit with multiple sector values and verify persistence/display in user/admin views; audit pages with site name and confirm shared `SCCT` value everywhere.

### Implementation for User Story 4

- [X] T025 [P] [US4] Implement `isMultiple` dropdown UI behavior for sector selections in `src/presentation/components/client/submission-form/field-renderer.tsx`
- [X] T026 [US4] Normalize multi-select sector arrays in submission/resubmission payload creation in `src/presentation/view-models/use-submission.ts`
- [X] T027 [US4] Validate and persist multi-select sector arrays in `src/domain/use-cases/client/submit-form.ts` and `src/data/repositories/mongo-field-value-repository.ts`
- [X] T028 [US4] Render stored multi-select sector values correctly in admin review UI in `src/presentation/components/admin/submission-review/index.tsx`
- [X] T029 [US4] Replace hardcoded logo text usage with shared site-name element in `src/components/shared/logo.tsx` and `src/components/shared/site-name.tsx`
- [X] T030 [US4] Replace hardcoded site-name metadata/title strings with shared element usage in `src/app/[locale]/layout.tsx`, `src/app/[locale]/submit/[token]/page.tsx`, `src/app/[locale]/admin/(authenticated)/dashboard/page.tsx`, `src/app/[locale]/admin/(authenticated)/forms/page.tsx`, `src/app/[locale]/admin/(authenticated)/forms/[id]/fields/page.tsx`, `src/app/[locale]/admin/(authenticated)/media/page.tsx`, `src/app/[locale]/admin/(authenticated)/settings/page.tsx`, and `src/app/[locale]/admin/(authenticated)/submissions/[id]/page.tsx`

**Checkpoint**: User Story 4 is independently functional and testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, quality checks, and heavy-process verification.

- [ ] T031 [P] Run User Story 1 manual verification steps and record pass/fail notes in `specs/007-fix-submission-form-sync/quickstart.md`
- [ ] T032 [P] Run User Story 2 manual verification steps (including offline + 7-day pending behavior simulation) and record results in `specs/007-fix-submission-form-sync/quickstart.md`
- [ ] T033 [P] Run User Story 3 manual verification steps (refresh reconciliation + dropped warning) and record results in `specs/007-fix-submission-form-sync/quickstart.md`
- [ ] T034 [P] Run User Story 4 manual verification steps (multi-select + site-name audit) and record results in `specs/007-fix-submission-form-sync/quickstart.md`
- [ ] T035 Execute `npm run lint` from `package.json` and resolve lint issues in `src/`
- [X] T036 Execute `npm run api:smoke` and `npm run build` from `package.json`, then document final verification notes in `specs/007-fix-submission-form-sync/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all story phases
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2
- **Phase 5 (US3)**: Depends on Phase 2 (recommended after US1 due shared view-model touchpoints)
- **Phase 6 (US4)**: Depends on Phase 2 (recommended after US3 due shared form rendering touchpoints)
- **Phase 7 (Polish)**: Depends on all targeted user stories being complete

### User Story Dependency Graph

- **US1 (P1)**: Starts after Foundational, independent business slice
- **US2 (P1)**: Starts after Foundational, independent business slice
- **US3 (P2)**: Starts after Foundational; logically independent, but shares client hook files with US1
- **US4 (P3)**: Starts after Foundational; logically independent, but shares renderer/hook files with US3

Recommended completion order for low-conflict delivery: **US1 + US2 (parallel)** -> **US3** -> **US4**.

### Heavy Process Staging (Principle VIII)

- Full smoke/build checks are deferred to Phase 7 (T036).
- Lightweight functional verification is executed before heavy checks (T031-T034).

---

## Parallel Execution Examples

### User Story 1

```bash
# Parallelizable US1 tasks
T008 in src/presentation/view-models/use-submission.ts
T009 in src/presentation/components/client/submission-form/contact-records.tsx
```

### User Story 2

```bash
# Parallelizable US2 tasks
T014 in src/data/models/submission.model.ts
T017 in src/app/api/submissions/[token]/events/route.ts
```

### User Story 3

```bash
# Parallelizable US3 tasks
T020 in src/presentation/view-models/use-submission.ts
T023 in src/app/api/admin/fields/reorder/route.ts + src/data/services/cache-service.ts
```

### User Story 4

```bash
# Parallelizable US4 tasks
T025 in src/presentation/components/client/submission-form/field-renderer.tsx
T029 in src/components/shared/logo.tsx + src/components/shared/site-name.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete US1 (Phase 3)
3. Validate min-one contact-record behavior end-to-end
4. Demo/deploy MVP slice

### Incremental Delivery

1. Deliver US1 and US2 as highest-priority outcomes
2. Deliver US3 refresh reconciliation behavior
3. Deliver US4 multi-select sector + site-name standardization
4. Run final polish and heavy verification

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Split parallel tracks after Phase 2:
   - Track A: US1
   - Track B: US2
3. Rejoin for US3 and US4 where shared files increase merge risk

---

## Notes

- [P] tasks are marked only where file/dependency separation allows safe parallel work.
- Every user story phase is independently testable per its phase checkpoint.
- Story labels `[US1]` ... `[US4]` are used only in user-story phases.
- All tasks include explicit file paths and are ready for `/speckit.implement`.
