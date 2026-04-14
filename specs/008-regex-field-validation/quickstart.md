# Quickstart: Regex Field Validation

## 1. Using the Centralized Regex Registry
Import patterns from `@/domain/constants/regex`.

```typescript
import { EGYPT_PHONE_REGEX } from "@/domain/constants/regex";

// Usage in Zod
const schema = z.object({
  phone: z.string().regex(EGYPT_PHONE_REGEX, { message: "Invalid Egypt phone" })
});
```

## 2. Dynamic Field Validation
When rendering dynamic fields in `DynamicFieldRenderer`, the field definition now includes `validationRules.regex`.

The `SubmissionViewModel` automatically applies these rules during form parsing.

## 3. Adding a new Regex to a Form Template
In the Admin Form Builder:
1. Select a field.
2. Enter the Regex string (e.g., `^[0-9]+$`).
3. Enter English/Arabic error messages.
4. Save.

## 4. Testing
- Run `npm run test` to verify regex matches for edge cases (e.g., empty strings, mixed characters).
