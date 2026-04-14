# Data Model: Regex Field Validation

## Entities

### FieldDefinition (Updated)
Extends the existing dynamic field definition with regex validation support.

| Field | Type | Description |
|-------|------|-------------|
| `validationRules.regex` | String | Optional regex pattern to enforce. |
| `validationRules.regexErrorEn` | String | Localized error message for English. |
| `validationRules.regexErrorAr` | String | Localized error message for Arabic. |

### User (Validation Update)
Enforces stricter formatting for team members.

| Field | Validation Pattern |
|-------|-------------------|
| `email` | Standard Email Regex |
| `phone` | Egyptian Mobile: `^(010|011|012|015)[0-9]{8}$` |

## Validation Logic
- **Client-Side**: `Zod` schema refinements.
- **Server-Side**: Mongoose `pre('save')` hooks or explicit service-layer validation.
