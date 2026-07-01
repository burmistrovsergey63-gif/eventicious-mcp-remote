# MCP Clients

Supported MCP clients for Eventicious MCP Remote Connector.

## Supported Clients

| Client | Setup Guide | Auth Method |
|--------|-------------|-------------|
| Claude Code | [CLAUDE_CODE_SETUP.md](CLAUDE_CODE_SETUP.md) | Bearer token (recommended) or headers |
| OpenCode | [OPENCODE_SETUP.md](OPENCODE_SETUP.md) | Bearer token (recommended) or headers |

## Authentication Methods

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
2. Receive: MCP token (valid 30 days by default)
3. Use: Include as `Authorization: Bearer mcp_evt_...` header
4. Verify: GET `/auth/verify` to check token status
5. Expiry: Exchange again after 30 days

## Security Model

- Eventicious credentials never stored on server
- MCP tokens contain encrypted credentials (AES-256-GCM)
- Tokens expire automatically
- Access revocation via Eventicious credentials on Eventicious side
- Emergency reset via server MCP_TOKEN_ENCRYPTION_KEY rotation

## Manual QA

Manager onboarding manual QA passed:
- server: eventicious-mcp-remote v0.6.4;
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