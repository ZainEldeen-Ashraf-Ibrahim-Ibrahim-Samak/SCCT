# Feature Specification: Regex Field Validation

**Feature Branch**: `008-regex-field-validation`  
**Created**: 2026-04-14  
**Status**: Draft  
**Input**: User description: "Implement regex validation when creating/editing user data in teams, the login form, and contact info in user submissions. Every type (email, phone, etc.) should have its own regex."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Team Member Creation (Priority: P1)

As an admin, I want to ensure that every team member I add has a valid email and phone number, so that the system doesn't store garbage data.

**Why this priority**: Core system integrity depends on valid user contact data for authentication and notifications.

**Independent Test**: Can be tested by attempting to add a team member with an invalid email (e.g., "test@com") or invalid phone (e.g., "123") and verifying that the system rejects it with a specific error message.

**Acceptance Scenarios**:

1. **Given** the Team Management page, **When** I enter an invalid email format into the "Email" field, **Then** the "Save" button should be disabled or an error message should appear immediately.
2. **Given** a new team member form, **When** I enter a valid phone number according to the regional regex, **Then** the validation should pass.

---

### User Story 2 - Accurate Submission Contact Data (Priority: P1)

As an admin reviewing submissions, I want to be certain that the contact info provided by clients (phone, email) is formatted correctly so that I can reach them without errors.

**Why this priority**: Essential for business operations and client communication.

**Independent Test**: Can be tested by submitting a form with invalid contact details and ensuring it fails validation before reaching the database.

**Acceptance Scenarios**:

1. **Given** a public submission form, **When** a user enters a phone number that doesn't match the required regex, **Then** a localized error message should be displayed.
2. **Given** the contact form fields, **When** all fields match their respective regex patterns, **Then** the submission should proceed successfully.

---

### User Story 3 - Secure Login Validation (Priority: P2)

As a user, I want the login form to validate my email format before sending it to the server, so I get instant feedback on typos.

**Why this priority**: Improves UX by catching errors early and reduces unnecessary server load/auth attempts.

**Independent Test**: Can be tested by entering "invalid-email" in the login screen and seeing the validation error before clicking "Sign In".

**Acceptance Scenarios**:

1. **Given** the login page, **When** I type an incomplete email address, **Then** the field should indicate a validation error.

---

### Edge Cases

- **International Phone Formats**: The system will enforce Egyptian regional formats for all phone number fields.
- **Empty Optional Fields**: If a field is optional but has a regex, empty values will bypass regex validation (i.e., regex is only applied if content is present).
- **Special Characters in Names**: Standard alphanumeric regex with support for Arabic characters will be used for name fields.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a centralized regex registry for common types (Email, Phone, URL). The Phone regex MUST be optimized for Egyptian formats (mobile and landline).
- **FR-002**: The Team Management form MUST apply email and phone regex validation to all member entries.
- **FR-003**: The Login form MUST validate the email field against the standard email regex before submission.
- **FR-004**: Submission forms MUST dynamically apply regex validation based on the `inputType` or a specific validation rule defined in the template.
- **FR-005**: All validation errors MUST be localized (English/Arabic).

### Key Entities *(include if feature involves data)*

- **ValidationRule**: Represents a regex pattern, a slug (e.g., "email"), and a localized error message.
- **ContactRecord**: Now includes a validation state based on the applied regex rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new team members added have a valid email format matching RFC 5322.
- **SC-002**: Decrease in "invalid phone" errors reported by admins during submission review by 90%.
- **SC-003**: Users receive validation feedback in under 100ms when typing in validated fields.

## Assumptions

- Standard email regex is sufficient for most use cases.
- [Assumption: Phone numbers will follow a general numeric-only or E.164-like format unless specified otherwise].
- Existing form templates will be updated to include these validation metadata.
