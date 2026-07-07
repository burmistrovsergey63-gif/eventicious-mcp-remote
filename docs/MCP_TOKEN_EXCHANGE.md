# MCP Token Exchange

## Overview

Stateless MCP Token Exchange allows managers to connect Eventicious MCP without storing raw credentials in config files. Exchange your Eventicious API credentials for an encrypted MCP token.

**Важно:** Endpoint `/auth/exchange` выдаёт только MCP token. Он не создаёт конфигурационный файл клиента автоматически. Конфиг создаётся отдельно — вручную или installer script-ом.

## Prerequisites

Подготовьте ваши Eventicious API credentials:
- Eventicious Base URL
- Client ID
- Client Secret
- MCP endpoint URL (provided by your administrator)

## Getting MCP Token

### Step 1: Exchange Credentials

```powershell
$env:EVENTICIOUS_BASE_URL="https://api-integration.eventicious.ru/"
$env:EVENTICIOUS_CLIENT_ID="<your-client-id>"
$env:EVENTICIOUS_CLIENT_SECRET="<your-client-secret>"

$exchange = @{
    baseUrl = $env:EVENTICIOUS_BASE_URL
    clientId = $env:EVENTICIOUS_CLIENT_ID
    clientSecret = $env:EVENTICIOUS_CLIENT_SECRET
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://your-endpoint.layero.ru/auth/exchange" -Method POST -ContentType "application/json" -Body $exchange

# Token is returned (masked output)
Write-Host "Token received, length: $($response.mcpToken.Length)"
```

Response:
```json
{
  "ok": true,
  "mcpToken": "mcp_evt_...",
  "mcpUrl": "https://your-endpoint.layero.ru/mcp",
  "expiresAt": "2027-01-03T...",
  "toolsCount": 75
}
```

### Step 2: Verify Token

```powershell
$verify = Invoke-RestMethod -Uri "https://your-endpoint.layero.ru/auth/verify" -Method GET -Headers @{ Authorization = "Bearer $($response.mcpToken)" }

# Check result
Write-Host "Verify result: $($verify.ok), tools: $($verify.toolsCount)"
```

Response:
```json
{
  "ok": true,
  "toolsCount": 75
}
```

### Step 3: Configure Client

Создайте конфигурационный файл клиента (отдельно от получения token).

**Для Claude Code** — создайте `.mcp.json`:
```json
{
  "mcpServers": {
    "eventicious": {
      "type": "http",
      "url": "https://your-endpoint.layero.ru/mcp",
      "authorization": {
        "type": "bearer",
        "token": "mcp_evt_..."
      }
    }
  }
}
```

### OpenCode

Для OpenCode используйте installer script или создайте `opencode.json` вручную.
См. [OPENCODE_SETUP.md](OPENCODE_SETUP.md) для детальной инструкции.

## Verification

### Check Health
```bash
curl https://your-endpoint.layero.ru/healthz
# Expected: {"ok":true,"service":"eventicious-mcp-remote","version":"1.0.0"}
```

### Verify MCP Connection
```bash
# With MCP token
curl -H "Authorization: Bearer mcp_evt_..." https://your-endpoint.layero.ru/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
# Expected: 75 tools in response
```

### Test Read-Only Tool
```bash
curl -H "Authorization: Bearer mcp_evt_..." https://your-endpoint.layero.ru/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"eventicious_auth_check","arguments":{"dry_run":true}}}'
# Expected: {"success":true}
```

## Token Format

- Prefix: `mcp_evt_`
- Contains encrypted Eventicious credentials
- Valid for 180 days by default (configurable via `MCP_TOKEN_TTL_DAYS`)
- AES-256-GCM encrypted

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Invalid request body | Missing required fields | Check baseUrl, clientId, clientSecret in request |
| 401 Invalid Eventicious credentials | Wrong credentials | Verify Eventicious Base URL, Client ID, Client Secret |
| 401 Invalid token format | Bad MCP token | Obtain fresh token via /auth/exchange |
| 401 Token expired | Token past expiry | Exchange credentials again |
| 404 Not found | Wrong endpoint | Use /auth/exchange (not /api/auth/exchange) |
| 500 Server configuration error | MCP_TOKEN_ENCRYPTION_KEY not set | Contact administrator |
| 502 Unable to reach Eventicious API | Network/timeout | Check Base URL, retry |

## Security Notes

- Eventicious credentials pass through server but are never stored
- MCP token contains encrypted credentials (AES-256-GCM)
- Secrets never logged (masked in server logs)
- Access revocation happens via Eventicious credentials on Eventicious side
- Emergency reset possible via MCP_TOKEN_ENCRYPTION_KEY rotation on server