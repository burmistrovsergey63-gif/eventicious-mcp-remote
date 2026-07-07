# MCP Clients

Supported MCP clients for Eventicious MCP Remote Connector.

## Supported Clients

| Клиент | Основной config | Рекомендуемый способ |
|--------|----------------|---------------------|
| OpenCode | `opencode.json` | installer script или ручной `opencode.json` |
| Claude Code | `.mcp.json` | ручной `.mcp.json` |
| Other MCP clients | depends | использовать URL `/mcp` + Bearer token |

## Authentication Methods

**Важно:** MCP-сервер не создаёт конфигурационный файл клиента автоматически. Конфиг создаётся отдельно — вручную или installer script-ом.

### Method 1: MCP Token (Recommended)

Exchange Eventicious credentials once, get encrypted MCP token:

```powershell
$exchange = @{
    baseUrl = "https://api-integration.eventicious.ru/"
    clientId = "<your-client-id>"
    clientSecret = "<your-client-secret>"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://your-endpoint.layero.ru/auth/exchange" -Method POST -ContentType "application/json" -Body $exchange
```

### Tools Discovery

Полный список доступных MCP инструментов можно получить без подключения SSE:

```text
GET /mcp/tools
```

Ответ: JSON с `toolCount` (текущее значение: 75) и массивом `tools` с именами инструментов.

Используйте `/mcp/tools` для проверки доступных инструментов без ручного парсинга SSE-ответа.

Use in client config:
```json
{
  "authorization": {
    "type": "bearer",
    "token": "mcp_evt_..."
  }
}
```

### Method 2: Legacy Headers

Pass credentials directly in each request:

```json
{
  "headers": {
    "x-eventicious-client-id": "<your-client-id>",
    "x-eventicious-client-secret": "<your-client-secret>",
    "x-eventicious-base-url": "https://api-integration.eventicious.ru"
  }
}
```

## HTTP Headers Reference

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization: Bearer <token>` | If using MCP token | MCP token with `mcp_evt_` prefix |
| `x-eventicious-client-id` | If not using MCP token | Eventicious client ID |
| `x-eventicious-client-secret` | If not using MCP token | Eventicious client secret |
| `x-eventicious-base-url` | No | Eventicious API base URL |
| `x-imgbb-api-key` | No | (Deprecated) ImgBB API key. Inline images now use public URLs via `imageUrl`. |

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/healthz` | GET | Health check |
| `/mcp` | POST | MCP requests |
| `/mcp` | GET | Service info |
| `/auth/exchange` | POST | Exchange credentials for MCP token |
| `/auth/verify` | GET | Verify MCP token validity |

## Token Lifecycle

1. Exchange: POST `/auth/exchange` with credentials
2. Receive: MCP token (valid 180 days by default, configurable via `MCP_TOKEN_TTL_DAYS`)
3. Use: Include as `Authorization: Bearer mcp_evt_...` header
4. Verify: GET `/auth/verify` to check token status and `expiresAt`
5. Expiry: If token expires, perform `/auth/exchange` again with your Eventicious credentials

## Security Model

- Eventicious credentials never stored on server
- MCP tokens contain encrypted credentials (AES-256-GCM)
- Tokens expire automatically
- Access revocation via Eventicious credentials on Eventicious side
- Emergency reset via server MCP_TOKEN_ENCRYPTION_KEY rotation

## Manual QA

Manager onboarding manual QA passed:
- server: eventicious-mcp-remote v1.0.0;
- transport: MCP 2024-11-05 / SSE;
- token validation: Credentials valid;
- tools visible: 75;
- first read-only check passed.

## Agent Guidelines

For connected AI agents, guidelines are available through MCP tool `eventicious_get_agent_instructions`. This includes UTF-8 handling rules, dry_run workflow, safety rules, and schedule-import workflow (prepare → validate → review → create/update).

## Schedule Import Workflow

For mass-importing sessions from Excel/CSV:
1. `eventicious_prepare_schedule_import` — build import plan from rows
2. `eventicious_validate_schedule_plan` — validate plan (no API calls)
3. Review errors/warnings, fix data if needed
4. Use `eventicious_create_session` / `eventicious_update_session` with `dry_run=true`
5. After preview, execute with `dry_run=false` + `confirm=true`

## Course Image Upload (Remote MCP)

Remote MCP servers cannot access local file paths. `eventicious_upload_course_images` supports four input modes — use exactly one:

| Mode | Field(s) | Description |
|------|----------|-------------|
| Public URL | `imageUrl` | Server downloads image (jpg/png, max 10 MB) |
| Base64 | `fileBase64` + optional `fileName`/`mimeType` | Base64-encoded image data |
| Data URI | `dataUri` | `data:image/jpeg;base64,...` or `data:image/png;base64,...` |
| Existing IDs | `coverImageFileId` + `coverImageThumbnailFileId` | Skip upload, use pre-uploaded IDs |

`filePaths` (local) only works if the server has filesystem access — not recommended for remote MCP.