# Contract: QR Navigation Policy

## Purpose

Define how scanned QR payloads are normalized, validated, and either opened in webview or blocked.

## Input Contract

```json
{
  "rawValue": "string",
  "scannedAt": "ISO-8601 datetime"
}
```

## Policy Configuration Contract

```json
{
  "allowedHosts": ["scct-damages.vercel.app", "example.scct.com"],
  "enforceHttps": true,
  "allowSubdomains": true,
  "blockedPathPrefixes": ["/admin/internal"]
}
```

## Validation Rules

1. `rawValue` must parse as a URL.
2. URL scheme must be `https` when `enforceHttps` is true.
3. URL host must match an allowed host (or allowed subdomain when enabled).
4. URL path must not match blocked prefixes.

## Decision Output Contract

```json
{
  "status": "accepted | rejected",
  "normalizedUrl": "string | null",
  "failureCode": "invalid_format | non_https | disallowed_host | blocked_path | null",
  "userMessageKey": "mobile.scan.invalid | mobile.scan.disallowed | mobile.scan.blocked"
}
```

## Error Handling Requirements

1. Rejections must map to localized user-facing message keys.
2. Rejected destinations must never be opened in webview.
3. Policy evaluation must be deterministic for identical inputs and config.

## Example Cases

### Accepted

Input:

```json
{
  "rawValue": "https://scct-damages.vercel.app/ar/submit/abc123",
  "scannedAt": "2026-04-15T10:30:00Z"
}
```

Output:

```json
{
  "status": "accepted",
  "normalizedUrl": "https://scct-damages.vercel.app/ar/submit/abc123",
  "failureCode": null,
  "userMessageKey": ""
}
```

### Rejected (Disallowed Host)

Input:

```json
{
  "rawValue": "https://malicious.example.com/phish",
  "scannedAt": "2026-04-15T10:32:00Z"
}
```

Output:

```json
{
  "status": "rejected",
  "normalizedUrl": null,
  "failureCode": "disallowed_host",
  "userMessageKey": "mobile.scan.disallowed"
}
```