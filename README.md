# Eventicious MCP Remote Connector

Remote MCP server for Eventicious External API v2, designed for deployment on Layero.

## Features

- Safe by default: All write operations use dry_run=true
- dry_run=true always works without confirm — previews are always safe
- confirm=true only required for real execution (dry_run=false)
- danger_confirm only required for destructive real execution (dry_run=false)
- Secure: Eventicious credentials passed via headers, never stored on server
- Simple: Clean architecture with TypeScript and Next.js App Router
- Deployable: Ready for Layero deployment via GitHub

## Architecture

app/ - Next.js App Router routes
  page.tsx - Landing page
  healthz/route.ts - Health check endpoint
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

## Health endpoint

Primary health endpoint:

```
GET /healthz
```

Expected response:

```json
{
  "ok": true,
  "service": "eventicious-mcp-remote",
  "version": "0.6.1"
}
```

> Note: Use `/healthz` (not `/health`) for Layero/production health checks. The `/health` path may be intercepted by platform built-in health checks.

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
   Health check: http://localhost:3000/healthz
   MCP endpoint: POST http://localhost:3000/mcp

## Required Headers

For MCP requests (POST /mcp):

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | If MCP_ACCESS_TOKEN set | Bearer {MCP_ACCESS_TOKEN} |
| x-eventicious-client-id | Yes | Your Eventicious project client_id |
| x-eventicious-client-secret | Yes | Your Eventicious project client_secret |
| x-eventicious-base-url | No | Defaults to EVENTICIOUS_DEFAULT_BASE_URL |

## OpenCode Installer

Для подключения к OpenCode без ручного редактирования `opencode.json`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\installers\opencode\install-opencode.ps1
```

Подробности: [docs/INSTALL_OPENCODE.md](docs/INSTALL_OPENCODE.md)

## Security Model

Eventicious credentials (client_id, client_secret) are NEVER stored on the server.
They arrive with every request via HTTP headers and are discarded after use.

Only these values are stored in server environment:
- MCP_ACCESS_TOKEN: Controls who can access the MCP endpoint
- EVENTICIOUS_DEFAULT_BASE_URL: Fallback base URL for Eventicious API
- DRY_RUN_DEFAULT: Default dry_run behavior

Bearer tokens from Eventicious are cached for 50 minutes, keyed by clientId+baseUrl.
Secrets are never written to logs (masked by logger).

## Why Stateless MCP is Enough

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
  .\scripts\smoke-health.ps1        # Tests GET /healthz
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
5. Set health check path: `/healthz`
6. Deploy - Layero builds and deploys automatically

## Production Checklist Before Layero Deploy

- [ ] Set MCP_ACCESS_TOKEN in Layero environment
- [ ] Set EVENTICIOUS_DEFAULT_BASE_URL in Layero environment
- [ ] NEVER set client_id/client_secret as global env vars
- [ ] Verify GET /healthz returns {ok: true}
- [ ] Verify POST /mcp responds to smoke test
- [ ] Test with dry_run=true first for all operations
- [ ] Confirm that real writes require confirm=true
- [ ] Check logs for any leaked secrets (should be masked)

## Available Tools (74 total)

### v0.1.0 core (8 tools)

- eventicious_auth_check: Verify credentials (read-only)
- eventicious_create_users: Create users (dry_run=true default)
- eventicious_update_users: Update users (dry_run=true default)
- eventicious_block_users: Block users (dry_run=true default)
- eventicious_unblock_users: Unblock users (dry_run=true default)
- eventicious_get_acl_groups: List groups (read-only)
- eventicious_create_acl_group: Create group (dry_run=true default)
- eventicious_move_users_to_groups: Move users between groups (dry_run=true default)

### v0.2 safety lifecycle (7 tools)

- eventicious_delete_users: Delete users (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_USERS')
- eventicious_update_acl_group: Rename a group (dry_run=true default)
- eventicious_delete_acl_group: Delete a group (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_ACL_GROUP')
- eventicious_add_user_roles: Assign Curator/Supervisor roles (dry_run=true default)
- eventicious_remove_user_roles: Remove roles (dry_run=true default)
- eventicious_add_user_mentors: Assign a mentor to mentees (dry_run=true default)
- eventicious_remove_user_mentors: Remove a mentor from mentees (dry_run=true default)

### v0.3 schedule pack (14 tools)

- eventicious_create_location: Create schedule location (dry_run=true default)
- eventicious_update_location: Update schedule location (dry_run=true default)
- eventicious_delete_location: Delete schedule location (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_LOCATIONS')
- eventicious_create_tag: Create schedule tag/topic (dry_run=true default)
- eventicious_update_tag: Update schedule tag (dry_run=true default)
- eventicious_delete_tag: Delete schedule tag (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_TAGS')
- eventicious_create_session: Create schedule session/event (dry_run=true default)
- eventicious_update_session: Update schedule session (dry_run=true default)
- eventicious_delete_session: Delete schedule session (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_SESSIONS')
- eventicious_create_session_attachment: Create attachment for session (dry_run=true default)
- eventicious_update_session_attachment: Update session attachment (dry_run=true default)
- eventicious_delete_session_attachment: Delete session attachment (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_SESSION_ATTACHMENTS')
- eventicious_prepare_schedule_import: Build safe import plan from Excel/JSON rows (helper, no API calls)
- eventicious_validate_schedule_plan: Validate import plan before real execution (helper, no API calls)

### v0.4 catalog pack (27 tools)

**Root catalog CRUD (5 tools):**
- eventicious_list_catalogs: List all root catalogs (read-only)
- eventicious_get_catalog: Get catalog/folder by ID with all elements (read-only)
- eventicious_create_catalog: Create root catalog (dry_run=true default)
- eventicious_update_catalog: Update catalog (dry_run=true default)
- eventicious_delete_catalog: Delete catalog (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_CATALOG')

**Folder management (3 tools):**
- eventicious_create_folder: Create folder with optional ACL visibility (dry_run=true default)
- eventicious_update_folder: Update folder with optional ACL visibility (dry_run=true default)
- eventicious_delete_folder: Delete folder (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_FOLDER')

**Content elements (10 tools):**
- eventicious_add_file_to_catalog: Add uploaded file to catalog (dry_run=true default)
- eventicious_delete_file_from_catalog: Delete file (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT')
- eventicious_create_link: Create link element (dry_run=true default)
- eventicious_delete_link: Delete link (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT')
- eventicious_create_text2: Create Text 2.0 / GravityJson element (dry_run=true default). Accepts GravityJson object, JSON string, or markdown (auto-converted)
- eventicious_delete_text2: Delete Text 2.0 element (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT')
- eventicious_add_video_to_catalog: Add uploaded video (dry_run=true default)
- eventicious_delete_video_from_catalog: Delete video (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT')
- eventicious_add_groups_to_catalog: Add ACL groups to catalog (dry_run=true default)
- eventicious_delete_group_from_catalog: Delete group (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_GROUP')

**Order and menu (4 tools):**
- eventicious_set_catalog_order: Reorder root catalogs (dry_run=true default)
- eventicious_set_catalog_element_order: Reorder elements within catalog (dry_run=true default)
- eventicious_add_to_menu: Add catalog/folder to menu (dry_run=true default)
- eventicious_delete_from_menu: Remove from menu (dry_run=true default, requires danger_confirm='CHANGE_EVENTICIOUS_CATALOG_ORDER')

**Bulk operations (1 tool):**
- eventicious_bulk_delete_catalog_elements: Bulk delete folders and elements (dry_run=true default, requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_ITEMS_BULK')

**Helper tools (4 tools, no API calls):**
- eventicious_convert_markdown_to_gravity_json: Convert markdown/plain text to GravityJson
- eventicious_validate_gravity_json: Validate GravityJson object
- eventicious_prepare_catalog_import: Build catalog import plan from JSON/tree structure
- eventicious_validate_catalog_plan: Validate catalog import plan before execution

## v0.4 Text 2.0 / GravityJson

All catalog text content uses Text 2.0 / GravityJson format exclusively. Legacy `/elements/texts` endpoints are intentionally NOT exposed as MCP tools.

**Supported text input methods:**
- GravityJson object (ProseMirror document)
- JSON string (parsed and validated)
- Markdown or plain text (auto-converted to GravityJson)

**Text 2.0 update strategy:**
Text 2.0 update is not available in current API docs. Safe update strategy is delete old Text 2.0 element + create new Text 2.0 element, only after explicit approval.

## v0.4 Folder ACL Visibility

Folders support `aclGroupsExternalIds` to restrict content visibility by ACL groups:
- Create folder with `aclGroupsExternalIds: [1001, 1002]`
- Update folder to change visibility: `aclGroupsExternalIds: [1001, 1003]`
- Groups must exist before using their external IDs in folder payload

## v0.4 Catalog Import Workflow

Safe catalog import workflow:
1. `eventicious_prepare_catalog_import` - Build plan from JSON/tree
2. `eventicious_validate_catalog_plan` - Validate plan
3. Review dry_run previews
4. Approve and execute with real API calls

Helper tools never perform real writes.

## v0.5 Course Pack + Gamification (8 tools)

### Course Import Pipeline

Course creation follows an import pipeline:
1. **Upload cover image** → `eventicious_upload_course_images` → get `coverImageFileId` + `coverImageThumbnailFileId`
2. **Import course structure** → `eventicious_import_course_structure` → returns `courseId`, `stageIds`, `pollIds`, `taskContentIds`, `scormIds`, `catalogIds`
3. **Map returned IDs** → `eventicious_map_course_import_response`
4. **Fill stage catalogs** via catalog tools
5. **Import poll/test content** → `eventicious_import_poll_content`
6. **Upload task attachments** → `eventicious_upload_task_attachments`
7. **Import task content** → `eventicious_import_task_content`
8. **Upload SCORM zip** → `eventicious_upload_scorm_to_stage`
9. **Check ready** → `eventicious_check_course_ready_to_finalize`
10. **Finalize course** → `eventicious_finalize_course` (requires `danger_confirm='FINALIZE_EVENTICIOUS_COURSE'`)

### Cover Image Required

Course creation requires both `coverImageFileId` and `coverImageThumbnailFileId`. Upload images first via `eventicious_upload_course_images`.

### Course Settings

- **progress**: `isEnabled`, `hintText`
- **finalScreen**: `isEnabled`, `title`, `text`
- **deadline**: `isEnabled`, `fixedDeadlineDate` or `relativeDeadlineUnits`+`relativeDeadlineValue`, `notificationSettings` with `localizedText` and `sendingPeriods`
- **isFreeOrderAllowed**: allow arbitrary stage order

### Stage Types

- **Common**: info/catalog content stages
- **Task**: task content with fields, review, attachments
- **Scorm**: SCORM zip upload

### Gamification

- `eventicious_add_manual_gamification_charge`: manually charge or write-off points to a user (positive=charge, negative=write-off)

## v0.6 Expo Pack + Gamification Fix (6 tools)

### Exhibitor Management

- `eventicious_create_exhibitor`: Create an exhibitor (company) in Eventicious
- `eventicious_update_exhibitor`: Update an exhibitor (WARNING: null/empty fields may reset values in admin)
- `eventicious_delete_exhibitor`: Delete an exhibitor (requires danger_confirm='DELETE_EVENTICIOUS_EXHIBITOR')

### Exhibitor Import Helpers

- `eventicious_prepare_exhibitors_import`: Prepare exhibitors import, normalize fields, detect duplicates
- `eventicious_validate_exhibitor_plan`: Validate exhibitor import plan

### Gamification Validation

- `eventicious_validate_gamification_charge`: Validate gamification charge/write-off parameters

### Gamification Fix

- Scores can now be positive (charge) or negative (write-off)
- Scores=0 is rejected by validation
- Max absolute value: 10000 (soft limit with warning)

### Notes

- CSV sync is intentionally excluded from MCP tools
- Callback endpoints are not exposed as MCP tools

## Safety model

All write tools default to dry_run=true. Real execution requires:
1. dry_run=false
2. confirm=true
3. For destructive operations: danger_confirm must match exact strings:
   - DELETE_EVENTICIOUS_USERS
   - DELETE_EVENTICIOUS_ACL_GROUP
   - DELETE_EVENTICIOUS_LOCATIONS
   - DELETE_EVENTICIOUS_TAGS
   - DELETE_EVENTICIOUS_SESSIONS
   - DELETE_EVENTICIOUS_SESSION_ATTACHMENTS
   - DELETE_EVENTICIOUS_CATALOG
   - DELETE_EVENTICIOUS_CATALOG_FOLDER
   - DELETE_EVENTICIOUS_CATALOG_CONTENT
   - DELETE_EVENTICIOUS_CATALOG_GROUP
   - DELETE_EVENTICIOUS_CATALOG_ITEMS_BULK
    - CHANGE_EVENTICIOUS_CATALOG_ORDER
    - FINALIZE_EVENTICIOUS_COURSE
    - DELETE_EVENTICIOUS_EXHIBITOR

## Development Commands

npm run dev          - Start development server
npm run build        - Build for production
npm run start        - Start production server
npm run lint         - Run linter and typecheck
npm run typecheck    - Check TypeScript types only
npm run test         - Run unit tests
npm run test:watch   - Run tests in watch mode
npm run test:coverage - Run tests with coverage

## Testing

Tests use Vitest with Node environment. Run:

```bash
npm run test       # Run all tests
npm run test:watch # Watch mode for development
```

Test files live next to source files (`*.test.ts`). Tests mock all external API calls.

## Smoke Checks

Smoke checks verify basic functionality without real API calls:

```bash
npm run smoke:list   # List available smoke test scripts
npm run smoke:tools  # Verify exactly 74 MCP tools are registered
npm run smoke:remote # Test remote deployment (requires MCP_REMOTE_URL env)
```

For remote smoke check with MCP access token:

```powershell
$env:MCP_REMOTE_URL="https://your-instance.layero.ru"
$env:MCP_ACCESS_TOKEN="your-token"
.\scripts\smoke-remote.ps1
```

## CI/CD

GitHub Actions workflow runs on pull_request and push to main:

- Checkout code
- Setup Node 20
- npm ci
- npm run typecheck
- npm run test
- npm run build

Workflow file: `.github/workflows/ci.yml`
