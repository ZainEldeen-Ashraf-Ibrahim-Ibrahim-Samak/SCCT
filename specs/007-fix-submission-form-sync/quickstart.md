# Quickstart: Fix Submission Form Sync

**Branch**: `main`  
**Spec**: `specs/007-fix-submission-form-sync/spec.md`

## Goal

Implement and verify:
1. contact-record add/edit/delete with a minimum of one,
2. durable user resubmission notifications + admin visibility,
3. token refresh reconciliation with latest form structure,
4. multi-select sector behavior,
5. reusable `SCCT` site-name usage.

## Implementation Order

1. **Data + Validation**
   - Update validation schema(s) and domain/data models for `contactRecords` minimum and multi-select sector arrays.
   - Ensure backward-compatible parsing where possible.

2. **Submission Flow + Reconciliation**
   - Update submission view model and form renderer for repeatable contacts and refresh reconciliation warning behavior.
   - Guarantee latest form structure wins on refresh while carrying matching unsaved values.

3. **Admin Status + Notification Durability**
   - Persist resubmission request state with 7-day pending retention.
   - Keep admin-visible status on revisit.

4. **Branding Standardization**
   - Introduce/consume shared site-name element (`SCCT`) in logo/page metadata contexts.

## Verification Checklist (Lightweight First)

1. **Contact records**
   - Add/edit/delete contact rows in submission UI.
   - Confirm final remaining row cannot be deleted.

2. **Resubmission notifications**
   - Admin marks submission `needs_rewrite` with comment.
   - User sees notification; admin revisit still shows state.

3. **Refresh reconciliation**
   - Open token form, type unsaved values.
   - Reorder/change fields in admin.
   - Refresh token page and confirm latest structure + carryover + dropped-values warning.

4. **Multi-select sector**
   - Select multiple sector values and submit/resubmit.
   - Confirm values persist in user/admin views.

5. **Site name standardization**
   - Inspect pages with site-title/logo metadata and verify `SCCT` is sourced from shared element.

## Final Heavy Verification (Late Stage)

Run only after implementation is feature-complete:

```bash
npm run lint
npm run api:smoke
npm run build
```

Expected:
- no lint/type failures,
- API smoke passes,
- production build succeeds.
