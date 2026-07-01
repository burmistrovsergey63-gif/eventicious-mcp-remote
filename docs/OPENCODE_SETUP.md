# OpenCode Setup

## Quick Setup (Recommended)

Run the installer script:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\installers\opencode\install-opencode.ps1
```

The installer will prompt for:
1. Project folder
2. MCP endpoint URL
3. MCP token (from /auth/exchange) OR Eventicious credentials directly

## Manual Setup

### Step 1: Get MCP Token

If you haven't already, exchange your Eventicious credentials:

```powershell
# Set your Eventicious credentials
$env:EVENTICIOUS_BASE_URL="https://api-integration.eventicious.ru/"
$env:EVENTICIOUS_CLIENT_ID="<your-client-id>"
$env:EVENTICIOUS_CLIENT_SECRET="<your-client-secret>"

# Exchange for MCP token
$exchange = @{
    baseUrl = $env:EVENTICIOUS_BASE_URL
    clientId = $env:EVENTICIOUS_CLIENT_ID
    clientSecret = $env:EVENTICIOUS_CLIENT_SECRET
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://your-endpoint.layero.ru/auth/exchange" -Method POST -ContentType "application/json" -Body $exchange
$env:EVENTICIOUS_MCP_TOKEN = $response.mcpToken
```

### Step 2: Create opencode.json

Create `opencode.json` in your project root:

```json
{
  "mcp": {
    "eventicious": {
      "type": "remote",
      "url": "https://your-endpoint.layero.ru/mcp",
      "enabled": true,
      "timeout": 120000,
      "authorization": {
        "type": "bearer",
        "token": "<your-mcp-token>"
      }
    }
  }
}
```

Or use environment variable:
```powershell
# Create .env in project root
"EVENTICIOUS_MCP_TOKEN=$env:EVENTICIOUS_MCP_TOKEN" | Out-File -FilePath ".env" -Encoding utf8
```

### Step 3: Verify Connection

In OpenCode, ask:
```
Check eventicious MCP - run tools/list and eventicious_auth_check
```

Expected: 75 tools available, auth_check returns success.

## Using .env File

Create `.env` with your token:
```
EVENTICIOUS_MCP_TOKEN=mcp_evt_...
```

The MCP client will read this automatically if configured to use bearer token.

## Verification Commands

```powershell
# Check health
curl https://your-endpoint.layero.ru/healthz

# Verify MCP token
curl -H "Authorization: Bearer mcp_evt_..." https://your-endpoint.layero.ru/auth/verify

# List tools
curl -H "Authorization: Bearer mcp_evt_..." https://your-endpoint.layero.ru/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| tools/list < 75 | Wrong token or endpoint | Verify MCP token via /auth/verify |
| auth_check failed | Expired credentials | Exchange fresh token via /auth/exchange |
| 401 Invalid token | Bad MCP token format | Get fresh token, check prefix `mcp_evt_` |
| Connection timeout | Wrong endpoint | Check MCP endpoint URL with admin |

## Security Notes

- Store `opencode.json` with placeholders, not real tokens
- Never commit real MCP tokens to version control
- Access revocation happens via Eventicious credentials on Eventicious side
- For automation: use environment variables, not hardcoded tokens