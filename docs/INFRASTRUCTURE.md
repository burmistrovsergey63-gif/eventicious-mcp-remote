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

See `docs/SCHEMA_AUDIT.md` and `docs/SCHEMA_AUDIT_CHECKPOINT.md` for analysis of Zod schema usage across tools.

Current status after Pass 1-5:
- 116 unit tests passing
- 19 simple CRUD tools migrated to raw shape exports
- Tags, locations, sessions, session-attachments, users/groups now use imported schemas
- Remaining inline schemas are intentional helper tools:
  - schedule-import (helper)
  - catalog-import (helper)
  - gravity-json (helper)

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