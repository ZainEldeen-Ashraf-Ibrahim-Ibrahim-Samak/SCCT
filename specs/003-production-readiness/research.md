# Research: Production Readiness

## Findings

### 1. Build and Type Check Failures
- **Location**: `src/app/api/admin/events/route.ts:33:35`
- **Issue**: `redis` is possibly `null`.
- **Solution**: Add null check or non-null assertion if verified, but safe check is preferred with fallback or error logging.

### 2. Standardized Logging (devLogger)
- **Target**: Replace all `console.log`, `console.error`, and `console.warn` in `/src`.
- **Design**:
  - `src/lib/dev-logger.ts` will export a `logger` object with `info`, `warn`, `error`, and `debug` methods.
  - In development, it will use `console`.
  - In production, it can be silenced or sent to a surveillance service (optional future scope).
  - Current usage: 10+ locations identified.

### 3. Hardcoded User-Facing Strings
- **Identified Strings**:
  - `src/presentation/components/admin/submission-review/index.tsx`: "No contact info provided", "You" (Audit admin name).
  - `src/presentation/components/client/submission-form/media-upload.tsx`: "Download", "Max size".
  - `src/presentation/components/admin/live-notifications.tsx`: "View Details →".
- **Action**: Move to `en.json` and `ar.json`.

### 4. Environment Model Discrepancies
- **Missing in `env.mjs`**:
  - `CRON_SECRET` (used in `backups/route.ts`)
  - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (used in client uploads)
- **Missing in `.env.example`**:
  - `CRON_SECRET`
- **Action**: Synchronize `env.mjs`, `.env.example`, and Vercel documentation.

### 5. API Robustness
- **Review**: Ensure all `NextResponse.json` use structured error messages and correct status codes.
- **Action**: Add try-catch blocks where missing and use `devLogger.error`.
