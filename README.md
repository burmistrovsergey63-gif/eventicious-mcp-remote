# Eventicious MCP Remote Connector

Remote MCP server for Eventicious External API v2, designed for deployment on Layero.

## Features

- Safe by default: All write operations use dry_run=true
- Secure: Eventicious credentials passed via headers, never stored on server
- Simple: Clean architecture with TypeScript and Next.js App Router
- Deployable: Ready for Layero deployment via GitHub

## Architecture

app/ - Next.js App Router routes
  page.tsx - Landing page
  health/route.ts - Health check endpoint
  mcp/route.ts - MCP endpoint (POST)
src/ - Source code
  config.ts - Environment configuration
  auth.ts - MCP token validation, credential extraction, credential validation
  eventicious-client.ts - Eventicious API client
  token-cache.ts - Bearer token caching (50 min TTL)
  errors.ts - Error classes
  logger.ts - Structured JSON logger with secret masking
  rate-limit.ts - Batch size guard and rate-limit warnings
  mcp/ - MCP server and transport
  schemas/ - Input validation schemas
  tools/ - Tool implementations
scripts/ - Smoke test scripts

## Quick Start

Prerequisites: Node.js 20+, Eventicious API credentials

1. Clone and install:
   npm install

2. Configure environment:
   cp .env.example .env
   Edit .env with your MCP_ACCESS_TOKEN

3. Run development server:
   npm run dev

4. Run smoke tests:
   .\scripts\smoke-health.ps1
   .\scripts\smoke-mcp-info.ps1

5. Test endpoints:
   Landing page: http://localhost:3000
   Health check: http://localhost:3000/health
   MCP endpoint: POST http://localhost:3000/mcp

## Required Headers

For MCP requests (POST /mcp):

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | If MCP_ACCESS_TOKEN set | Bearer {MCP_ACCESS_TOKEN} |
| x-eventicious-client-id | Yes | Your Eventicious project client_id |
| x-eventicious-client-secret | Yes | Your Eventicious project client_secret |
| x-eventicious-base-url | No | Defaults to EVENTICIOUS_DEFAULT_BASE_URL |

## Security Model

Eventicious credentials (client_id, client_secret) are NEVER stored on the server.
They arrive with every request via HTTP headers and are discarded after use.

Only these values are stored in server environment:
- MCP_ACCESS_TOKEN: Controls who can access the MCP endpoint
- EVENTICIOUS_DEFAULT_BASE_URL: Fallback base URL for Eventicious API
- DRY_RUN_DEFAULT: Default dry_run behavior

Bearer tokens from Eventicious are cached for 50 minutes, keyed by clientId+baseUrl.
Secrets are never written to logs (masked by logger).

## Why Stateless MCP is Enough for v0.1

The MCP transport runs in stateless mode (no session persistence).
Each request creates a fresh MCP server instance and transport.
This is sufficient because:
- Each request carries its own credentials via headers
- Token caching is handled in-memory by the Eventicious client
- No server-side state needs to persist between tool calls
- Simplifies deployment: no sticky sessions or shared state needed

Stateful sessions can be added later if needed for long-running operations.

## Local Smoke Testing

Run the smoke tests to verify the server is working:

PowerShell:
  .\scripts\smoke-health.ps1        # Tests GET /health
  .\scripts\smoke-mcp-info.ps1      # Tests POST /mcp without credentials

For full auth test:
  1. Copy scripts\smoke-auth-check.example.ps1 to scripts\smoke-auth-check.local.ps1
  2. Fill in your real credentials in the .local.ps1 file
  3. Run: .\scripts\smoke-auth-check.local.ps1

The .local.ps1 files are git-ignored.

## Deployment to Layero

1. Push to GitHub
2. Connect to Layero dashboard
3. Create new app from GitHub
4. Configure environment variables:
   - MCP_ACCESS_TOKEN: Your secure token
   - EVENTICIOUS_DEFAULT_BASE_URL: https://api-integration.eventicious.ru
   - DRY_RUN_DEFAULT: true
5. Deploy - Layero builds and deploys automatically

## Production Checklist Before Layero Deploy

- [ ] Set MCP_ACCESS_TOKEN in Layero environment
- [ ] Set EVENTICIOUS_DEFAULT_BASE_URL in Layero environment
- [ ] NEVER set client_id/client_secret as global env vars
- [ ] Verify GET /health returns {ok: true}
- [ ] Verify POST /mcp responds to smoke test
- [ ] Test with dry_run=true first for all operations
- [ ] Confirm that real writes require confirm=true
- [ ] Check logs for any leaked secrets (should be masked)

## Available Tools

- eventicious_auth_check: Verify credentials (read-only)
- eventicious_create_users: Create users (dry_run=true default)
- eventicious_update_users: Update users (dry_run=true default)
- eventicious_block_users: Block users (dry_run=true default)
- eventicious_unblock_users: Unblock users (dry_run=true default)
- eventicious_get_acl_groups: List groups (read-only)
- eventicious_create_acl_group: Create group (dry_run=true default)
- eventicious_move_users_to_groups: Move users between groups (dry_run=true default)

## Development Commands

npm run dev          - Start development server
npm run build        - Build for production
npm run start        - Start production server
npm run lint         - Run linter and typecheck
npm run typecheck    - Check TypeScript types only
