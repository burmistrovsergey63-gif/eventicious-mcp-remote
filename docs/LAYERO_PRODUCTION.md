# Layero Production Deploy Checklist

## Deploy Configuration

- **Framework:** Next.js
- **Node.js:** 20
- **Build command:** `npm run build`
- **Health check path:** `/healthz`

## Required Environment Variables

Set these in Layero UI only:

| Variable | Value |
|----------|-------|
| `MCP_ACCESS_TOKEN` | `<set in Layero only>` |
| `EVENTICIOUS_DEFAULT_BASE_URL` | `https://api-integration.eventicious.ru` |
| `DRY_RUN_DEFAULT` | `true` |

## Do NOT Set Globally

Never set these as global environment variables:

- `EVENTICIOUS_CLIENT_ID`
- `EVENTICIOUS_CLIENT_SECRET`

These must be passed per-request via HTTP headers.

## Security

- Rotate `MCP_ACCESS_TOKEN` before production if it was ever exposed in chat/logs
- Eventicious credentials are never stored on the server
- All secrets are masked in logs

## Verify Production

Run these checks after deploy:

```powershell
# 1. Health check
GET /healthz
# Expected: {"ok":true,"service":"eventicious-mcp-remote","version":"0.1.0"}

# 2. Auth protection
POST /mcp without Authorization
# Expected: 401

# 3. Credentials validation
POST /mcp with Authorization but without Eventicious headers
# Expected: 400 credentials error

# 4. Tools available
POST /mcp tools/list
# Expected: 8 tools
```

## First Real Write Test

Only after successful `eventicious_auth_check`:

1. Run `eventicious_create_acl_group` with `dry_run: true`
2. Verify preview looks correct
3. Then run with `dry_run: false` and `confirm: true`
