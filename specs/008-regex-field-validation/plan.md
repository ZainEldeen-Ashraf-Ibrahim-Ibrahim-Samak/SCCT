# Implementation Plan: Regex Field Validation

**Branch**: `008-regex-field-validation` | **Date**: 2026-04-14 | **Spec**: [spec.md](file:///d:/SCCT/specs/008-regex-field-validation/spec.md)
**Input**: Feature specification from `/specs/008-regex-field-validation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

This feature implements a robust, centralized regex validation system across the SCCT platform. It focuses on three critical areas: administrative team management, the user login portal, and dynamic client submission forms. The technical approach involves creating a shared validation registry that enforces Egyptian-specific constraints for phone numbers while allowing flexible regex assignments for other data types (Email, URL, etc.). Validation will be enforced consistently at the ViewModel layer (client-side) and through server-side integrity checks (Data layer).

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ (LTS)  
**Primary Dependencies**: Next.js 16.x (App Router), Zod 4.x, next-intl 4.x, Mongoose 8.x  
**Storage**: MongoDB (Mongoose)  
**Testing**: Jest, React Testing Library  
**Target Platform**: Web (Responsive, RTL/LTR)
**Project Type**: web-service (Next.js Fullstack)  
**Performance Goals**: <100ms validation latency (client-side), zero impact on server throughput  
**Constraints**: MUST support full RTL localization for error messages; MUST enforce Egyptian phone formats specifically  
**Scale/Scope**: Impacts all submission forms, login flows, and team member creation (P1/P2 priorities)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] I. Clean Architecture (MVVM) compliance? (Validation in Domain/ViewModels)
- [x] II. Technology Stack Mandate followed? (Next.js, MongoDB, ShadCN)
- [x] V. Internationalization (AR/EN) & RTL support planned? (Localized validation errors)
- [x] VIII. Heavy processes (build, e2e, migrations) deferred to the final phase? (Build checks deferred)

## Project Structure

### Documentation (this feature)

```text
specs/008-regex-field-validation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── domain/              # Centralized regex patterns & validation logic
├── data/                # Mongoose schema updates (validationRegex field)
├── presentation/
│   ├── components/      # UI components (Login, TeamForm, DynamicField)
│   └── view-models/     # Validation enforcement logic
```

**Structure Decision**: Standard repository structure following Clean Architecture (MVVM).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | N/A        | N/A                                 |
