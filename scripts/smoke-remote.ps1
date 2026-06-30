<#
.SYNOPSIS
    Remote smoke tests for Eventicious MCP Remote Connector.

.DESCRIPTION
    Tests the remote deployment health, MCP endpoint, and tool count.
    Uses environment variables for configuration. Does NOT perform write operations.

.EXAMPLE
    .\scripts\smoke-remote.ps1
    $env:MCP_REMOTE_URL="https://example.layero.ru" .\scripts\smoke-remote.ps1

    With MCP access token:
    $env:MCP_ACCESS_TOKEN="your-token" $env:MCP_REMOTE_URL="..." .\scripts\smoke-remote.ps1
#>

param(
    [string]$BaseUrl = $env:MCP_REMOTE_URL
)

if (-not $BaseUrl) {
    Write-Host "ERROR: MCP_REMOTE_URL environment variable not set" -ForegroundColor Red
    Write-Host "Usage: `$env:MCP_REMOTE_URL='https://your-url.layero.ru' .\scripts\smoke-remote.ps1" -ForegroundColor Yellow
    exit 1
}

$results = @()

function Test-Step {
    param([string]$Name, [scriptblock]$Test)
    try {
        $result = & $Test
        $results += [PSCustomObject]@{ Test = $Name; Status = "PASS"; Detail = $result }
    } catch {
        $results += [PSCustomObject]@{ Test = $Name; Status = "FAIL"; Detail = $_.Exception.Message }
    }
}

$headers = @{}
if ($env:MCP_ACCESS_TOKEN) {
    $headers["Authorization"] = "Bearer $env:MCP_ACCESS_TOKEN"
    $clientId = if ($env:EVENTICIOUS_CLIENT_ID) { $env:EVENTICIOUS_CLIENT_ID } else { "smoke-test" }
    $clientSecret = if ($env:EVENTICIOUS_CLIENT_SECRET) { $env:EVENTICIOUS_CLIENT_SECRET } else { "smoke-test-secret" }
    $headers["x-eventicious-client-id"] = $clientId
    $headers["x-eventicious-client-secret"] = $clientSecret
}

$expectedToolCount = 74

Write-Host "`nRemote Smoke Tests: $BaseUrl" -ForegroundColor Cyan
Write-Host "Expected tool count: $expectedToolCount" -ForegroundColor Cyan
Write-Host ""

# 1. Health check
Test-Step "GET /healthz - health endpoint" {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/healthz" -Method GET
    if ($resp.ok -eq $true -and $resp.service -eq "eventicious-mcp-remote") {
        return "ok=true, service=$($resp.service), version=$($resp.version)"
    }
    throw "Unexpected response: $($resp | ConvertTo-Json -Compress)"
}

# 2. MCP endpoint - requires auth token
if ($env:MCP_ACCESS_TOKEN) {
    Test-Step "POST /mcp with auth - tools/list" {
        $body = '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
        $resp = Invoke-RestMethod -Uri "$BaseUrl/mcp" -Method POST -ContentType "application/json" -Body $body -Headers $headers
        $toolCount = ($resp.result.tools | Measure-Object).Count
        if ($toolCount -eq $expectedToolCount) {
            return "200 OK, $toolCount tools found (matches expected)"
        }
        throw "Expected $expectedToolCount tools, got $toolCount"
    }
} else {
    Write-Host "  Skipping MCP endpoint test (no MCP_ACCESS_TOKEN provided)" -ForegroundColor Yellow
    Write-Host "  Set MCP_ACCESS_TOKEN env var to test tools/list endpoint" -ForegroundColor Yellow
}

# Print results
Write-Host "`nResults:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
if ($failed -gt 0) {
    Write-Host "`n$failed test(s) FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nAll smoke tests PASSED" -ForegroundColor Green
}