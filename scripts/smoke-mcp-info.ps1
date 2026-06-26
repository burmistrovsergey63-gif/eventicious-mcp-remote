# Smoke test: POST /mcp (minimal JSON-RPC request without Eventicious credentials)
# Purpose: Verify the MCP endpoint is alive and responds with JSON-RPC, not 500
# Usage: .\scripts\smoke-mcp-info.ps1

$baseUrl = "http://localhost:3000"
$url = "$baseUrl/mcp"

Write-Host "Testing POST $url (JSON-RPC tools/list)" -ForegroundColor Cyan

$body = @{
    jsonrpc = "2.0"
    id      = 1
    method  = "tools/list"
    params  = @{}
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
    Write-Host "Status: OK (received JSON-RPC response)" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode" -ForegroundColor Yellow

    if ($statusCode -eq 400) {
        Write-Host "400 is expected if x-eventicious-client-id/secret headers are missing" -ForegroundColor Yellow
        Write-Host "This means the endpoint is alive and validating credentials" -ForegroundColor Green
    } elseif ($statusCode -eq 500) {
        Write-Host "FAIL: 500 Internal Server Error - something is broken" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "Response: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
