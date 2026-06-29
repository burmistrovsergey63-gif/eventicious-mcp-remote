# Infrastructure

## Local Checks

```bash
npm run typecheck    # TypeScript type checking
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run build        # Build for production
npm run smoke:list   # List available smoke test scripts
```

## CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml` runs on:
- `pull_request`
- `push` to `main` branch

Steps:
1. Checkout code
2. Setup Node.js 20
3. `npm ci` (clean install)
4. `npm run typecheck`
5. `npm run test`
6. `npm run build`

## Smoke Tests

Smoke tests are PowerShell scripts in `scripts/`. They should only run in dry-run mode:

- `scripts/smoke-health.ps1` - Basic health check
- `scripts/smoke-mcp-info.ps1` - MCP endpoint info
- `scripts/smoke-v*-dryrun.ps1` - Version-specific dry run tests

All smoke tests use `dry_run=true` by default. Never run with `confirm=true` on production without explicit intent.

## Schema Audit

See `docs/SCHEMA_AUDIT.md` for analysis of Zod schema usage across tools.

Current status:
- 17 schema files in `src/schemas/`
- Some tools use inline schemas (transport.ts, locations.ts, sessions.ts, etc.)
- Schema migration can be done incrementally

## Structured Errors

Helper at `src/utils/errors.ts` provides:

```ts
type StructuredError = {
  code: string;
  message: string;  // secrets are masked
  details?: unknown;
  retryable: boolean;
  safe_to_retry: boolean;
};
```

Functions:
- `createStructuredError(message, details?)` - Create structured error
- `normalizeToStructuredError(error, defaultMessage?)` - Normalize any error to structured format

## Layero Branch Status

Default branch on GitHub is `main`. Layero production has been migrated to `main`. See `docs/LAYERO_BRANCH_MIGRATION.md` for migration history.