# Smoke test: eventicious_auth_check tool
# IMPORTANT: This is an EXAMPLE with placeholders.
# Copy this file to smoke-auth-check.local.ps1 and fill in real values.
# Add *.local.ps1 to .gitignore to prevent committing secrets.
#
# Usage: Copy to smoke-auth-check.local.ps1, fill in values, then run:
#   .\scripts\smoke-auth-check.local.ps1

$MCP_ACCESS_TOKEN = "YOUR_MCP_ACCESS_TOKEN"
$EVENTICIOUS_CLIENT_ID = "YOUR_EVENTICIOUS_CLIENT_ID"
$EVENTICIOUS_CLIENT_SECRET = "YOUR_EVENTICIOUS_CLIENT_SECRET"
# Optional: override if not using default
# $EVENTICIOUS_BASE_URL = "https://api-integration.eventicious.ru"

$baseUrl = "http://localhost:3000"
$url = "$baseUrl/mcp"

Write-Host "Testing eventicious_auth_check tool" -ForegroundColor Cyan
Write-Host "NOTE: Using placeholder credentials - copy to .local.ps1 with real values" -ForegroundColor Yellow

$body = @{
    jsonrpc = "2.0"
    id      = 1
    method  = "tools/call"
    params  = @{
        name      = "eventicious_auth_check"
        arguments = @{}
    }
} | ConvertTo-Json -Depth 5

$headers = @{
    "Authorization"                = "Bearer $MCP_ACCESS_TOKEN"
    "x-eventicious-client-id"     = $EVENTICIOUS_CLIENT_ID
    "x-eventicious-client-secret" = $EVENTICIOUS_CLIENT_SECRET
}

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json" -Headers $headers
    Write-Host "Status: OK" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode" -ForegroundColor Yellow
    Write-Host "Response: $($_.Exception.Message)" -ForegroundColor Yellow
}
