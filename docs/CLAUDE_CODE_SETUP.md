# Claude Code Setup

## Quick Setup

### Step 1: Get MCP Token

Exchange your Eventicious API credentials for an MCP token:

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
$env:EVENTICIOUS_MCP_TOKEN = $response.mcpToken
```

### Step 2: Create .mcp.json

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "eventicious": {
      "type": "http",
      "url": "https://your-endpoint.layero.ru/mcp",
      "authorization": {
        "type": "bearer",
        "token": "<your-mcp-token>"
      }
    }
  }
}
```

Replace `<your-mcp-token>` with the token from Step 1.

### Step 3: Verify Connection

In Claude Code, ask:
```
Check eventicious MCP connection
```

The assistant should see 74 tools available.

## Alternative: Direct Headers

If you prefer not to use MCP tokens, use headers directly:

```json
{
  "mcpServers": {
    "eventicious": {
      "type": "http",
      "url": "https://your-endpoint.layero.ru/mcp",
      "headers": {
        "x-eventicious-client-id": "<your-client-id>",
        "x-eventicious-client-secret": "<your-client-secret>",
        "x-eventicious-base-url": "https://api-integration.eventicious.ru"
      }
    }
  }
}
```

## Verification

```bash
# Check health
curl https://your-endpoint.layero.ru/healthz
# Expected: {"ok":true,"service":"eventicious-mcp-remote","version":"0.6.3"}

# Verify MCP token
curl -H "Authorization: Bearer mcp_evt_..." https://your-endpoint.layero.ru/auth/verify
# Expected: {"ok":true,"toolsCount":74}

# List tools
curl -H "Authorization: Bearer mcp_evt_..." https://your-endpoint.layero.ru/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
# Expected: 74 tools in response
```

## Security Notes

- Never commit `.mcp.json` with real tokens to version control
- Add `.mcp.json` to `.gitignore` if it contains secrets
- Access revocation happens via Eventicious credentials on Eventicious side
- MCP tokens are encrypted and expire after 30 days