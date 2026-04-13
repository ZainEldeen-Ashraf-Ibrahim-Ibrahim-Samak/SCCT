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

- [x] T001 Capture baseline hard-coded string, console usage, and warning inventory in `specs/003-production-readiness/research.md`
- [x] T002 Add production-readiness validation workflow section in `specs/003-production-readiness/quickstart.md`
- [x] T003 [P] Create API smoke-test scaffold for core endpoints in `src/lib/scripts/api-smoke.ts`
- [x] T004 [P] Register smoke-test command in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared logging, environment, and API response foundations required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Create centralized logger with `info/warn/error/debug` methods in `src/lib/dev-logger.ts`
- [x] T006 [P] Migrate shared infrastructure logging calls to the new logger in `src/lib/events/publisher.ts` and `src/lib/redis.ts`
- [x] T007 [P] Add required runtime/server env schema keys (`CRON_SECRET`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`) in `src/env.mjs`
- [x] T008 [P] Sync required environment template keys and comments in `.env.example`
- [x] T009 Create reusable API error-response helper for contract compliance in `src/lib/api-response.ts`
- [x] T010 Integrate API error-response helper in `src/app/api/admin/backups/route.ts` and `src/app/api/admin/events/route.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Quality Assurance & Hard-coded String Removal (Priority: P1) 🎯 MVP

**Goal**: Remove user-facing hard-coded strings and enforce localized message usage across key UI surfaces.

**Independent Test**: Run `npm run i18n:lint` and manually traverse affected UI paths in both locales with no hard-coded English/Arabic strings exposed.

### Tests for User Story 1

- [x] T011 [US1] Add bilingual UI regression checklist for admin/client flows in `specs/003-production-readiness/quickstart.md`

### Implementation for User Story 1

- [x] T012 [P] [US1] Add missing localization keys for submission/media/notification labels in `src/messages/en.json` and `src/messages/ar.json`
- [x] T013 [P] [US1] Replace hard-coded fallback and optimistic admin strings in `src/presentation/components/admin/submission-review/index.tsx`
- [x] T014 [P] [US1] Replace hard-coded media action and size labels in `src/presentation/components/client/submission-form/media-upload.tsx`
- [x] T015 [P] [US1] Replace hard-coded notification CTA label in `src/presentation/components/admin/live-notifications.tsx`
- [x] T016 [US1] Record and verify hard-coded string scan steps for touched components in `specs/003-production-readiness/quickstart.md`

**Checkpoint**: User Story 1 is fully localized and independently testable.

---

## Phase 4: User Story 2 - Build Warning and Error Mitigation (Priority: P1)

**Goal**: Eliminate TypeScript, ESLint, Next.js, and styling warnings/errors from the production build path.

**Independent Test**: `npm run build` completes with exactly 0 warnings/errors.

### Tests for User Story 2

- [x] T017 [US2] Add zero-warning build verification checklist in `specs/003-production-readiness/quickstart.md`

### Implementation for User Story 2

- [x] T018 [US2] Resolve nullability and stream lifecycle issues in `src/app/api/admin/events/route.ts`
- [x] T019 [P] [US2] Replace lint-unsafe error callback usage in `src/data/repositories/mongo-submission-repository.ts`
- [x] T020 [P] [US2] Resolve lint/style warnings in components including `src/presentation/components/shared/theme-toggle/index.tsx` and `language-switcher`
- [x] T021 [US2] Track remaining warning fixes and final clean-build evidence in `specs/003-production-readiness/research.md`

**Checkpoint**: User Story 2 yields a clean build and remains independently verifiable.

---

## Phase 5: User Story 4 - Environment Variable Validation & API Review (Priority: P1)

**Goal**: Guarantee env contract parity (`env.mjs` ↔ `.env.example`) and enforce standardized, secure API behavior for production deployment.

**Independent Test**: Build succeeds with `.env.example`-derived values and API smoke tests pass with expected status/error payloads.

### Tests for User Story 4

- [x] T022 [US4] Implement endpoint smoke-test cases and expected outcomes in `src/lib/scripts/api-smoke.ts`

### Implementation for User Story 4

- [x] T023 [P] [US4] Enforce required env validation for deployment-critical keys in `src/env.mjs`
- [x] T024 [P] [US4] Mirror env validation keys and deployment placeholders in `.env.example`
- [x] T025 [US4] Standardize cron/manual backup endpoint error payloads to contract shape in `src/app/api/admin/backups/route.ts`
- [x] T026 [US4] Standardize SSE/admin events and cloudinary signing error payloads in `src/app/api/admin/events/route.ts` and `src/app/api/cloudinary/sign/route.ts`
- [x] T027 [US4] Standardize admin submissions/forms error payloads in `src/app/api/admin/submissions/route.ts` and `src/app/api/admin/forms/route.ts`
- [x] T028 [US4] Wire smoke-test script usage and execution instructions in `package.json` and `specs/003-production-readiness/quickstart.md`

**Checkpoint**: User Story 4 guarantees env/API production contract readiness and is independently testable.

---

## Phase 6: User Story 3 - Comprehensive Logging Standardization (Priority: P2)

**Goal**: Replace scattered `console.*` usage with the centralized `dev-logger` standard across runtime and tooling code.

**Independent Test**: Global scan across `src` shows no direct `console.log/error/warn` usage outside approved logger implementation boundaries.

### Tests for User Story 3

- [x] T029 [US3] Add logger-compliance verification commands in `specs/003-production-readiness/quickstart.md`

### Implementation for User Story 3

- [x] T030 [US3] Replace component-level console logging with `dev-logger` in `src/presentation/components/client/submission-form/media-upload.tsx` and `src/presentation/components/admin/submission-review/index.tsx`
- [x] T031 [P] [US3] Replace event-notification logging with `dev-logger` in `src/presentation/components/admin/live-notifications.tsx` and `src/app/api/admin/events/route.ts`
- [x] T032 [P] [US3] Replace remaining shared library/repository console usage with `dev-logger` in `src/lib/events/publisher.ts`, `src/lib/redis.ts`, and `src/data/repositories/mongo-submission-repository.ts`
- [x] T033 [P] [US3] Replace utility script console usage with `dev-logger` or adapter wrapper in `src/lib/scripts/i18n-sync.ts` and `src/lib/scripts/i18n-lint.ts`
- [x] T034 [US3] Record and verify no-console scan evidence in `specs/003-production-readiness/research.md`

**Checkpoint**: User Story 3 enforces consistent logging standards and is independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize production readiness evidence and cross-story validation.

- [x] T035 [P] Finalize unified production validation runbook in `specs/003-production-readiness/quickstart.md`
- [x] T036 [P] Document Vercel deployment readiness and env parity sign-off in `specs/003-production-readiness/research.md`
- [x] T037 Execute full validation suite and capture outputs in `specs/003-production-readiness/research.md`
