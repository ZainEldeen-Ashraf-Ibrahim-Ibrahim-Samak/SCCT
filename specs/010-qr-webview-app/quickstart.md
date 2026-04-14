# Quickstart: QR Webview Companion App

**Branch**: `main`  
**Spec**: `specs/010-qr-webview-app/spec.md`

## Goal

Implement and verify a companion mobile flow that:
1. scans QR codes,
2. validates destinations with an allowlist policy,
3. opens accepted links in in-app webview,
4. keeps AR/EN string parity,
5. mirrors SCCT branding on launcher and splash,
6. validates runtime configuration at startup.

## Implementation Order

1. **Policy and Configuration Foundations**
   - Define URL allowlist policy contract and startup config schema.
   - Add startup validation with safe-fail localized errors.

2. **QR Scan and Validation Pipeline**
   - Wire scanner capture to payload normalization and policy evaluation.
   - Implement blocked-destination and invalid-scan user messaging.

3. **Webview Session Flow**
   - Open accepted URLs in-app.
   - Support same-session rescan to replace current destination safely.

4. **Localization and RTL/LTR Behavior**
   - Add AR/EN keys for all scanner, error, and startup texts.
   - Validate translation key parity.

5. **Branding and Splash Delivery**
   - Use canonical SCCT name and favicon-derived assets for launcher/splash.
   - Ensure splash-to-interactive transition after startup checks.

## Lightweight Verification (During Implementation)

1. Validate URL policy behavior with accepted and rejected QR samples.
2. Validate startup safe-fail when required config values are missing.
3. Validate AR/EN rendering and key parity for new mobile messages.
4. Validate rescan behavior while webview session is active.
5. Validate camera-permission denied and offline error states.

## Final Heavy Verification (Late Stage)

Run only after feature implementation is complete:

```bash
npm run lint
npm run build
```

Then run final device-focused checks in the companion mobile shell workspace:
1. Android release build and smoke launch.
2. iOS release build and smoke launch.
3. End-to-end QR to webview navigation checks with production-like config.

## Expected Exit Criteria

1. Valid QR destinations open in-app within success criteria thresholds.
2. Disallowed or malformed destinations are blocked with clear localized messages.
3. All required UI text exists in both Arabic and English.
4. Launcher name, icon, and splash identity match SCCT branding.
5. Startup config issues are detected before user interactions.