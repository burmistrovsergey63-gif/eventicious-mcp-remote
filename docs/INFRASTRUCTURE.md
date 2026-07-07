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
6. `npm run smoke:tools`
7. `npm run build`

## Smoke Tests

### Cross-Platform (Node.js) — works on Windows, Linux, macOS

- `npm run smoke:tools` - Verify exactly 75 MCP tools are registered (no env required)
- `npm run smoke:health` - GET /healthz (requires `MCP_REMOTE_URL`)
- `npm run smoke:mcp-info` - GET /mcp info (requires `MCP_REMOTE_URL`)
- `npm run smoke:remote-tools` - POST /mcp initialize + tools/list (requires `MCP_REMOTE_URL` + `MCP_ACCESS_TOKEN`)
- `npm run smoke:auth-verify` - GET /auth/verify (requires `MCP_REMOTE_URL` + `MCP_ACCESS_TOKEN`)
- `npm run smoke:list` - List available smoke test scripts

### PowerShell (Windows-only)

- `.\scripts\smoke-health.ps1` - GET /healthz
- `.\scripts\smoke-mcp-info.ps1` - GET /mcp
- `.\scripts\smoke-remote.ps1` - POST /mcp (requires `MCP_REMOTE_URL` + `MCP_ACCESS_TOKEN`)
- `.\scripts\smoke-auth-exchange.ps1` - Auth exchange (requires Eventicious credentials)

### Environment Variables

| Script | MCP_REMOTE_URL | MCP_ACCESS_TOKEN |
|--------|:--------------:|:----------------:|
| smoke:tools | - | - |
| smoke:health | required | - |
| smoke:mcp-info | required | - |
| smoke:remote-tools | required | required |
| smoke:auth-verify | required | required |

### What They Check

- **health**: HTTP 200, `ok: true`, `service: "eventicious-mcp-remote"`, version present
- **mcp-info**: HTTP 200, service/protocol/endpoint/version fields present
- **remote-tools**: initialize handshake + tools/list returns exactly 75 tools
- **auth-verify**: HTTP 200, `ok: true`, `toolsCount: 75`, service present

Last verified: Layero preview at https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru - 75 tools confirmed.

Smoke tests should only run in dry-run mode. Never run with `confirm=true` on production without explicit intent.

## Schema Audit

See `docs/SCHEMA_AUDIT.md` and `docs/SCHEMA_AUDIT_CHECKPOINT.md` for analysis of Zod schema usage across tools.

Current status after release 0.6.4:
- 364 unit tests passing
- 75 MCP tools registered
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