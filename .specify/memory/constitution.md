<!--
  Sync Impact Report
  ─────────────────────────────────────────────────────
  Version change: 0.0.0 → 1.0.0
  Bump rationale: MAJOR — initial constitution creation
    from blank template with all principles defined.

  Modified principles:
    [PRINCIPLE_1_NAME] → I. Clean Architecture (MVVM)
    [PRINCIPLE_2_NAME] → II. Technology Stack Mandate
    [PRINCIPLE_3_NAME] → III. Dynamic Schema Design
    [PRINCIPLE_4_NAME] → IV. Media Management via Cloudinary
    [PRINCIPLE_5_NAME] → V. Internationalization & Theming

  Added sections:
    VI. Caching & Performance (Upstash Redis)
    VII. Security & Data Integrity
    Technology Stack Requirements (Section 2)
    Development Workflow (Section 3)

  Removed sections: (none — all template placeholders replaced)

  Templates requiring updates:
    ✅ .specify/templates/plan-template.md — reviewed, no updates needed
    ✅ .specify/templates/spec-template.md — reviewed, no updates needed
    ✅ .specify/templates/tasks-template.md — reviewed, no updates needed
    ⚠  .specify/templates/commands/ — directory does not exist, skipped

  Follow-up TODOs: none
  ─────────────────────────────────────────────────────
-->

# SCCT Constitution

## Core Principles

### I. Clean Architecture (MVVM)

The project MUST follow Clean Architecture with the MVVM
(Model-View-ViewModel) pattern across the full stack.

- **Separation of concerns**: Every layer (Data, Domain, Presentation)
  MUST reside in its own directory and MUST NOT import from a higher
  layer.
- **Dependency rule**: Dependencies MUST point inward — Presentation →
  Domain → Data. The Domain layer MUST have zero framework imports.
- **ViewModels**: Each UI screen/page MUST have a dedicated ViewModel
  that encapsulates all presentation logic. Views MUST NOT contain
  business logic.
- **Repository pattern**: All data access (MongoDB, Cloudinary, Redis)
  MUST go through repository interfaces defined in the Domain layer,
  with concrete implementations in the Data layer.
- **Rationale**: Enforcing MVVM and clean boundaries ensures the
  codebase remains testable, maintainable, and allows swapping
  infrastructure (e.g., database, cache) without touching business
  rules.

### II. Technology Stack Mandate

All technology choices are fixed and MUST NOT be substituted without a
constitution amendment.

- **Runtime**: Node.js (latest LTS) for both backend API and frontend
  build tooling.
- **Database**: MongoDB (via Mongoose ODM) as the sole persistent
  data store.
- **Media storage**: Cloudinary MUST be used for all file/image
  uploads and transformations. Local file storage is prohibited.
- **Caching**: Upstash Redis MUST be used for all caching needs;
  in-memory caches are acceptable only for request-scoped data.
- **Frontend framework**: Next.js with ShadCN UI component library.
- **Styling**: ShadCN UI theming system; custom components MUST extend
  ShadCN primitives rather than bypass them.
- **Rationale**: A locked stack prevents ecosystem fragmentation and
  ensures every developer works within the same tooling constraints.

### III. Dynamic Schema Design

The system's data model MUST support admin-defined, variable fields
without requiring code changes or redeployment.

- **Field definitions**: Admins MUST be able to create named fields
  (e.g., "ID Photos", "Issue Photos", "Phone Number") and assign an
  input type (text, number, file/image, select, date, etc.) at
  runtime.
- **Schema storage**: Field definitions MUST be stored as first-class
  MongoDB documents, separate from user submissions.
- **Validation**: Each field definition MUST include validation rules
  that are enforced both client-side and server-side.
- **Extensibility**: Adding a new input type MUST require only a new
  type enum value and a corresponding renderer component — no schema
  migration.
- **Rationale**: The core value proposition is flexibility; hard-coded
  schemas would undermine the product's purpose.

### IV. Media Management via Cloudinary

All media (images, documents, videos) MUST flow through Cloudinary.

- **Upload flow**: Client uploads MUST use Cloudinary unsigned or
  signed upload presets; direct uploads to the server filesystem are
  prohibited.
- **URL storage**: Only Cloudinary public IDs and secure URLs MUST be
  persisted in MongoDB — never raw binary data.
- **Transformations**: Image optimizations (resize, format conversion)
  MUST be handled via Cloudinary transformation URLs, not server-side
  processing.
- **Cleanup**: When a submission or field is deleted, the associated
  Cloudinary assets MUST be destroyed via the Admin API to prevent
  orphaned media.
- **Rationale**: Centralizing media on Cloudinary offloads storage,
  CDN delivery, and transformation costs from the application server.

### V. Internationalization & Theming

The application MUST support Arabic (ar) and English (en) with full
RTL/LTR layout switching and dark/light theme toggling from day one.

- **i18n framework**: All user-facing strings MUST use translation
  keys managed through an i18n library (e.g., next-intl or i18next).
  Hard-coded strings in components are prohibited.
- **Translation files**: Each locale MUST have a complete JSON
  translation file. Missing keys MUST fall back to English and log a
  warning.
- **RTL support**: The layout MUST dynamically switch direction based
  on the active locale. CSS MUST use logical properties
  (margin-inline-start, padding-inline-end) instead of physical
  properties (margin-left, padding-right).
- **Theming**: Dark and light themes MUST be implemented via CSS
  variables and ShadCN UI's built-in theming. Theme preference MUST
  persist across sessions (localStorage or cookie).
- **Rationale**: The target user base spans Arabic and English
  speakers; shipping without full RTL and bilingual support is a
  launch blocker.

### VI. Caching & Performance (Upstash Redis)

Upstash Redis MUST be the centralized caching layer for all
read-heavy and session data.

- **Cache strategy**: Field definitions, submission listing pages,
  and admin dashboard aggregations MUST be cached with explicit TTLs.
- **Invalidation**: Any mutation (create, update, delete) MUST
  invalidate the relevant cache keys immediately.
- **Session/Auth**: If session-based auth is used, sessions MUST be
  stored in Redis, not in MongoDB or in-memory.
- **Rate limiting**: API endpoints MUST use Redis-backed rate limiting
  to prevent abuse.
- **Rationale**: Upstash Redis provides serverless-friendly,
  low-latency caching that reduces MongoDB load and improves
  response times.

### VII. Security & Data Integrity

The system handles potentially sensitive client data (ID photos,
personal information) and MUST enforce strict security practices.

- **Input sanitization**: All user-submitted text MUST be sanitized
  before storage and rendering to prevent XSS and injection attacks.
- **Authentication**: Admin endpoints MUST require authenticated
  sessions. Client submission endpoints MUST be protected against
  CSRF.
- **Authorization**: Role-based access MUST separate admin operations
  (field management, review) from client operations (data submission).
- **Audit trail**: Every status change (viewed, not viewed, needs
  rewrite) MUST be logged with timestamp and admin user ID.
- **Rationale**: Handling identity documents and personal data
  demands security-first design to protect users and comply with
  data protection expectations.

## Technology Stack Requirements

The following versions and services are mandated:

| Layer          | Technology              | Notes                          |
|----------------|-------------------------|--------------------------------|
| Runtime        | Node.js (LTS)           | Backend API + build tooling    |
| Frontend       | Next.js + ShadCN UI     | App Router, server components  |
| Database       | MongoDB (Mongoose)      | Atlas or self-hosted           |
| Media          | Cloudinary              | Upload, transform, CDN         |
| Cache          | Upstash Redis           | Serverless Redis               |
| i18n           | next-intl / i18next     | AR + EN, RTL/LTR               |
| Theming        | ShadCN + CSS Variables  | Dark / Light                   |
| Architecture   | Clean Arch + MVVM       | Domain-driven layers           |

- All dependencies MUST be pinned to exact versions in
  `package-lock.json`.
- Deployment target MUST remain flexible (Vercel, Docker, Cloud Run)
  — no vendor lock-in at the infrastructure layer.

## Development Workflow

### Branching & Commits

- Feature branches MUST follow the naming convention
  `###-feature-name` (e.g., `001-dynamic-fields`).
- Commits MUST use conventional commit messages
  (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- Pull requests MUST pass linting and type checks before merge.

### Code Review & Quality Gates

- Every pull request MUST be reviewed by at least one other developer
  (or the AI assistant acting as reviewer).
- Linting (ESLint) and formatting (Prettier) MUST be enforced via
  pre-commit hooks or CI.
- No `any` types in TypeScript — strict mode MUST be enabled.

### Testing Strategy

- Unit tests MUST cover all ViewModel logic and service functions.
- Integration tests MUST cover API endpoints and database operations.
- E2E tests SHOULD cover critical user journeys (submission flow,
  admin review flow).

## Governance

- This constitution supersedes all ad-hoc decisions. Any practice
  that conflicts with these principles MUST be changed or raised as
  an amendment.
- Amendments require: (1) a written proposal documenting the change
  and rationale, (2) review and approval, (3) a migration plan if
  existing code is affected.
- All pull requests and code reviews MUST verify compliance with
  these principles. Non-compliant code MUST NOT be merged.
- Complexity beyond what these principles prescribe MUST be justified
  in the Complexity Tracking table of the implementation plan.
- Use the project's `.specify/` guidance files for runtime
  development guidance.

**Version**: 1.0.0 | **Ratified**: 2026-04-12 | **Last Amended**: 2026-04-12
