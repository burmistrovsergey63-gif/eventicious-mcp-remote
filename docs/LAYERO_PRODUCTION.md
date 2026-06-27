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
# Expected: {"ok":true,"service":"eventicious-mcp-remote","version":"0.5.0"}

# 2. Auth protection
POST /mcp without Authorization
# Expected: 401

# 3. Credentials validation
POST /mcp with Authorization but without Eventicious headers
# Expected: 400 credentials error

# 4. Tools available
POST /mcp tools/list
# Expected: 64+ tools (15 v0.1/v0.2 + 14 v0.3 schedule + 27 v0.4 catalog + 8 v0.5 course/gamification)
```

## v0.4 Dry-Run Smoke Test

Run the v0.4 smoke test after deploy:

```powershell
.\scripts\smoke-v04-dryrun.ps1 -BaseUrl "https://your-app.layero.ru" -McpAccessToken "your-token"
```

This tests:
- Catalog CRUD dry_run
- Folder CRUD dry_run with aclGroupsExternalIds
- Link create/delete dry_run
- Text 2.0 create/delete dry_run with GravityJson
- Markdown to GravityJson helper
- Video create/delete dry_run
- Group add/delete dry_run
- Order/menu dry_run
- Bulk delete dry_run
- Catalog import prepare/validate helpers

## Important Notes

- No real catalog import without `eventicious_validate_catalog_plan` passing
- Text 2.0 / GravityJson only - legacy text endpoints intentionally not exposed
- All destructive operations require exact danger_confirm strings

## v0.4.1 Patch Notes

- dry-run previews do NOT require `confirm=true` — all tools now correctly return previews when `dry_run=true` (or default true)
- `confirm=true` is only required when `dry_run=false`
- `danger_confirm` is only required when `dry_run=false` for destructive operations
- Run `.\scripts\smoke-dryrun-no-confirm.ps1` to verify the regression fix

## v0.5 Course Pack

- 8 new tools: course import, finalize, image upload, poll import, task import, task attachment upload, SCORM upload, gamification charge
- Course import pipeline: upload images → import structure → map IDs → fill content → ready check → finalize
- Cover image required: `coverImageFileId` + `coverImageThumbnailFileId`
- Finalize requires `danger_confirm='FINALIZE_EVENTICIOUS_COURSE'`
- No real uploads/finalize in smoke tests
- Run `.\scripts\smoke-v05-dryrun.ps1` after deploy

## First Real Write Test

Only after successful `eventicious_auth_check`:

1. Run `eventicious_create_acl_group` with `dry_run: true`
2. Verify preview looks correct
3. Then run with `dry_run: false` and `confirm: true`
