# Tasks: Production Readiness

**Input**: Design documents from `/specs/003-production-readiness/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This feature explicitly requires validation (`i18n:lint`, zero-warning build, endpoint smoke testing), so test/verification tasks are included in each user story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared validation assets and execution entry points for production-readiness work.

- [ ] T001 Capture baseline hard-coded string, console usage, and warning inventory in `specs/003-production-readiness/research.md`
- [ ] T002 Add production-readiness validation workflow section in `specs/003-production-readiness/quickstart.md`
- [ ] T003 [P] Create API smoke-test scaffold for core endpoints in `src/lib/scripts/api-smoke.ts`
- [ ] T004 [P] Register smoke-test command in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared logging, environment, and API response foundations required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Create centralized logger with `info/warn/error/debug` methods in `src/lib/dev-logger.ts`
- [ ] T006 [P] Migrate shared infrastructure logging calls to the new logger in `src/lib/events/publisher.ts` and `src/lib/redis.ts`
- [ ] T007 [P] Add required runtime/server env schema keys (`CRON_SECRET`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`) in `src/env.mjs`
- [ ] T008 [P] Sync required environment template keys and comments in `.env.example`
- [ ] T009 Create reusable API error-response helper for contract compliance in `src/lib/api-response.ts`
- [ ] T010 Integrate API error-response helper in `src/app/api/admin/backups/route.ts` and `src/app/api/admin/events/route.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Quality Assurance & Hard-coded String Removal (Priority: P1) 🎯 MVP

**Goal**: Remove user-facing hard-coded strings and enforce localized message usage across key UI surfaces.

**Independent Test**: Run `npm run i18n:lint` and manually traverse affected UI paths in both locales with no hard-coded English/Arabic strings exposed.

### Tests for User Story 1

- [ ] T011 [US1] Add bilingual UI regression checklist for admin/client flows in `specs/003-production-readiness/quickstart.md`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Add missing localization keys for submission/media/notification labels in `src/messages/en.json` and `src/messages/ar.json`
- [ ] T013 [P] [US1] Replace hard-coded fallback and optimistic admin strings in `src/presentation/components/admin/submission-review/index.tsx`
- [ ] T014 [P] [US1] Replace hard-coded media action and size labels in `src/presentation/components/client/submission-form/media-upload.tsx`
- [ ] T015 [P] [US1] Replace hard-coded notification CTA label in `src/presentation/components/admin/live-notifications.tsx`
- [ ] T016 [US1] Record and verify hard-coded string scan steps for touched components in `specs/003-production-readiness/quickstart.md`

**Checkpoint**: User Story 1 is fully localized and independently testable.

---

## Phase 4: User Story 2 - Build Warning and Error Mitigation (Priority: P1)

**Goal**: Eliminate TypeScript, ESLint, Next.js, and styling warnings/errors from the production build path.

**Independent Test**: `npm run build` completes with exactly 0 warnings/errors.

### Tests for User Story 2

- [ ] T017 [US2] Add zero-warning build verification checklist in `specs/003-production-readiness/quickstart.md`

### Implementation for User Story 2

- [ ] T018 [US2] Resolve nullability and stream lifecycle issues in `src/app/api/admin/events/route.ts`
- [ ] T019 [P] [US2] Replace lint-unsafe error callback usage in `src/data/repositories/mongo-submission-repository.ts`
- [ ] T020 [P] [US2] Resolve lint/style warnings in `src/presentation/components/admin/submission-review/index.tsx` and `src/presentation/components/admin/live-notifications.tsx`
- [ ] T021 [US2] Track remaining warning fixes and final clean-build evidence in `specs/003-production-readiness/research.md`

**Checkpoint**: User Story 2 yields a clean build and remains independently verifiable.

---

## Phase 5: User Story 4 - Environment Variable Validation & API Review (Priority: P1)

**Goal**: Guarantee env contract parity (`env.mjs` ↔ `.env.example`) and enforce standardized, secure API behavior for production deployment.

**Independent Test**: Build succeeds with `.env.example`-derived values and API smoke tests pass with expected status/error payloads.

### Tests for User Story 4

- [ ] T022 [US4] Implement endpoint smoke-test cases and expected outcomes in `src/lib/scripts/api-smoke.ts`

### Implementation for User Story 4

- [ ] T023 [P] [US4] Enforce required env validation for deployment-critical keys in `src/env.mjs`
- [ ] T024 [P] [US4] Mirror env validation keys and deployment placeholders in `.env.example`
- [ ] T025 [US4] Standardize cron/manual backup endpoint error payloads to contract shape in `src/app/api/admin/backups/route.ts`
- [ ] T026 [US4] Standardize SSE/admin events and cloudinary signing error payloads in `src/app/api/admin/events/route.ts` and `src/app/api/cloudinary/sign/route.ts`
- [ ] T027 [US4] Standardize admin submissions/forms error payloads in `src/app/api/admin/submissions/route.ts` and `src/app/api/admin/forms/route.ts`
- [ ] T028 [US4] Wire smoke-test script usage and execution instructions in `package.json` and `specs/003-production-readiness/quickstart.md`

**Checkpoint**: User Story 4 guarantees env/API production contract readiness and is independently testable.

---

## Phase 6: User Story 3 - Comprehensive Logging Standardization (Priority: P2)

**Goal**: Replace scattered `console.*` usage with the centralized `dev-logger` standard across runtime and tooling code.

**Independent Test**: Global scan across `src` shows no direct `console.log/error/warn` usage outside approved logger implementation boundaries.

### Tests for User Story 3

- [ ] T029 [US3] Add logger-compliance verification commands in `specs/003-production-readiness/quickstart.md`

### Implementation for User Story 3

- [ ] T030 [US3] Replace component-level console logging with `dev-logger` in `src/presentation/components/client/submission-form/media-upload.tsx` and `src/presentation/components/admin/submission-review/index.tsx`
- [ ] T031 [P] [US3] Replace event-notification logging with `dev-logger` in `src/presentation/components/admin/live-notifications.tsx` and `src/app/api/admin/events/route.ts`
- [ ] T032 [P] [US3] Replace remaining shared library/repository console usage with `dev-logger` in `src/lib/events/publisher.ts`, `src/lib/redis.ts`, and `src/data/repositories/mongo-submission-repository.ts`
- [ ] T033 [P] [US3] Replace utility script console usage with `dev-logger` or adapter wrapper in `src/lib/scripts/i18n-sync.ts` and `src/lib/scripts/i18n-lint.ts`
- [ ] T034 [US3] Record and verify no-console scan evidence in `specs/003-production-readiness/research.md`

**Checkpoint**: User Story 3 enforces consistent logging standards and is independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize production readiness evidence and cross-story validation.

- [ ] T035 [P] Finalize unified production validation runbook in `specs/003-production-readiness/quickstart.md`
- [ ] T036 [P] Document Vercel deployment readiness and env parity sign-off in `specs/003-production-readiness/research.md`
- [ ] T037 Execute full validation suite and capture outputs in `specs/003-production-readiness/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; starts immediately.
- **Foundational (Phase 2)**: Depends on Phase 1; blocks all user stories.
- **User Stories (Phase 3-6)**: Depend on Phase 2 completion.
- **Polish (Phase 7)**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on other stories.
- **US2 (P1)**: Starts after Phase 2; no dependency on other stories.
- **US4 (P1)**: Starts after Phase 2; no dependency on other stories.
- **US3 (P2)**: Starts after Phase 2; recommended after US2/US4 to reduce file overlap during cross-cutting log migration.

### Recommended Completion Order

1. Phase 1 → Phase 2
2. US1 (MVP)
3. US2 and US4 (parallel or sequential)
4. US3
5. Phase 7 polish

---

## Parallel Opportunities

- **Setup**: T003 and T004 can run in parallel.
- **Foundational**: T006, T007, and T008 can run in parallel after T005.
- **US1**: T012-T015 can run in parallel after T011.
- **US2**: T019 and T020 can run in parallel after T018.
- **US4**: T023 and T024 can run in parallel; T026 and T027 can run in parallel after T025.
- **US3**: T031, T032, and T033 can run in parallel after T030.

---

## Parallel Example: User Story 1

```bash
# Parallel localization tasks for US1
Task: "T012 [US1] Add missing localization keys in src/messages/en.json and src/messages/ar.json"
Task: "T013 [US1] Replace hard-coded strings in src/presentation/components/admin/submission-review/index.tsx"
Task: "T014 [US1] Replace hard-coded strings in src/presentation/components/client/submission-form/media-upload.tsx"
Task: "T015 [US1] Replace hard-coded strings in src/presentation/components/admin/live-notifications.tsx"
```

## Parallel Example: User Story 2

```bash
# Parallel warning mitigation tasks for US2
Task: "T019 [US2] Fix warning in src/data/repositories/mongo-submission-repository.ts"
Task: "T020 [US2] Fix warnings in src/presentation/components/admin/submission-review/index.tsx and src/presentation/components/admin/live-notifications.tsx"
```

## Parallel Example: User Story 4

```bash
# Parallel env/API contract tasks for US4
Task: "T023 [US4] Enforce env keys in src/env.mjs"
Task: "T024 [US4] Sync env keys in .env.example"

# Then parallel endpoint standardization
Task: "T026 [US4] Standardize errors in src/app/api/admin/events/route.ts and src/app/api/cloudinary/sign/route.ts"
Task: "T027 [US4] Standardize errors in src/app/api/admin/submissions/route.ts and src/app/api/admin/forms/route.ts"
```

## Parallel Example: User Story 3

```bash
# Parallel logging migration tasks for US3
Task: "T031 [US3] Migrate logging in src/presentation/components/admin/live-notifications.tsx and src/app/api/admin/events/route.ts"
Task: "T032 [US3] Migrate logging in src/lib/events/publisher.ts, src/lib/redis.ts, and src/data/repositories/mongo-submission-repository.ts"
Task: "T033 [US3] Migrate logging in src/lib/scripts/i18n-sync.ts and src/lib/scripts/i18n-lint.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate with `npm run i18n:lint` and bilingual UI walkthrough.
4. Stop for review/demo as MVP milestone.

### Incremental Delivery

1. Deliver US1 (localization compliance).
2. Deliver US2 (zero-warning build compliance).
3. Deliver US4 (env/API production contract compliance).
4. Deliver US3 (cross-cutting log standardization).
5. Complete Phase 7 final validation and deployment readiness sign-off.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. Split P1 stories across engineers (US1, US2, US4).
3. Merge and stabilize, then execute US3 as coordinated cross-cutting migration.
4. Run final polish/validation as a joint release readiness pass.

---

## Notes

- All tasks follow the required checklist format: `- [ ] T### [P?] [US?] Description with file path`.
- `[US#]` labels are used only in user story phases.
- `[P]` tasks are limited to independent files to minimize merge conflicts.
- Validation evidence is captured in `specs/003-production-readiness/research.md` and `specs/003-production-readiness/quickstart.md`.
