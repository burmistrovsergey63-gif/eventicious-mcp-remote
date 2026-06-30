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

- `npm run smoke:list` - List available smoke test scripts
- `npm run smoke:tools` - Verify exactly 74 MCP tools are registered (local static check)
- `npm run smoke:remote` - Test remote deployment health and MCP endpoint

Smoke tests should only run in dry-run mode. Never run with `confirm=true` on production without explicit intent.

## Schema Audit

See `docs/SCHEMA_AUDIT.md` and `docs/SCHEMA_AUDIT_CHECKPOINT.md` for analysis of Zod schema usage across tools.

Current status after hardening release 0.6.1:
- 156 unit tests passing
- 74 MCP tools registered
- Schema shapes verified compatible with server.tool()
- Remaining inline schemas are intentional helper tools:
  - schedule-import (helper, high-risk candidate for future hardening)
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