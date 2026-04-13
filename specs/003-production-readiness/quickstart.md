# Quickstart: Production Validation

## Production Build Test

To verify that the application is production-ready, run:

```bash
npm run build
```

The build MUST complete with:
- **Zero** TypeScript errors
- **Zero** Next.js compilation warnings
- **Zero** ESLint warnings
- **Zero** Tailwind CSS warnings

## i18n Validation

Ensure all strings are synchronized and no stubs remain:

```bash
npm run i18n:lint
```

## Logging Validation

Search for leftover `console.log` statements in the source code:

```bash
# In PowerShell
Get-ChildItem -Path src -Filter *.ts,*.tsx -Recurse | Select-String "console\.(log|error|warn)"
```
