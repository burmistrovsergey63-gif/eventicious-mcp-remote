<#
.SYNOPSIS
    Remote smoke tests for Eventicious MCP Remote Connector.

.DESCRIPTION
    Tests the remote deployment health, auth protection, and MCP endpoint.
    Does NOT use real Eventicious credentials or make write requests.

.PARAMETER BaseUrl
    The base URL of the deployed application (e.g. https://example.layero.ru)

.PARAMETER McpAccessToken
    Optional MCP access token. If provided, tests auth-protected endpoints.

.EXAMPLE
    .\scripts\smoke-remote.ps1 -BaseUrl "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru"
    .\scripts\smoke-remote.ps1 -BaseUrl "https://example.layero.ru" -McpAccessToken "your-token"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,

    [Parameter(Mandatory=$false)]
    [string]$McpAccessToken
)

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

# Strip trailing slash
$BaseUrl = $BaseUrl.TrimEnd('/')

Write-Host "`nRemote Smoke Tests: $BaseUrl`n" -ForegroundColor Cyan

# 1. Health check
Test-Step "GET /healthz" {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/healthz" -Method GET
    if ($resp.ok -eq $true -and $resp.service -eq "eventicious-mcp-remote") {
        return "ok=true, service=$($resp.service), version=$($resp.version)"
    }
    throw "Unexpected response: $($resp | ConvertTo-Json -Compress)"
}

# 2. Auth protection - no token
Test-Step "POST /mcp without Auth => 401" {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/mcp" -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
        throw "Expected 401 but got success"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            return "401 as expected"
        }
        throw "Expected 401, got $($_.Exception.Response.StatusCode)"
    }
}

# 3. Auth protection - with token but no Eventicious headers
if ($McpAccessToken) {
    Test-Step "POST /mcp with Auth, no creds => 400" {
        $headers = @{ "Authorization" = "Bearer $McpAccessToken" }
        try {
            Invoke-RestMethod -Uri "$BaseUrl/mcp" -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' -Headers $headers
            throw "Expected error but got success"
        } catch {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($statusCode -eq 400 -or $statusCode -eq 401) {
                return "$statusCode as expected"
            }
            throw "Expected 400/401, got $statusCode"
        }
    }

    Test-Step "POST /mcp tools/list with Auth + fake creds => 200" {
        $headers = @{
            "Authorization" = "Bearer $McpAccessToken"
            "x-eventicious-client-id" = "fake-id"
            "x-eventicious-client-secret" = "fake-secret"
        }
        $body = '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
        $resp = Invoke-RestMethod -Uri "$BaseUrl/mcp" -Method POST -ContentType "application/json" -Body $body -Headers $headers
        $toolCount = ($resp.result.tools | Measure-Object).Count
        if ($toolCount -ge 8) {
            return "$toolCount tools found"
        }
        throw "Expected >= 8 tools, got $toolCount"
    }
} else {
    Write-Host "  Skipping auth tests (no McpAccessToken provided)`n" -ForegroundColor Yellow
}

# Print results
Write-Host "Results:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
if ($failed -gt 0) {
    Write-Host "$failed test(s) FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "All tests PASSED" -ForegroundColor Green
}
