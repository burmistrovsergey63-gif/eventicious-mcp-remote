<#
.SYNOPSIS
    Smoke test for MCP Token Exchange endpoint.

.DESCRIPTION
    Tests the /auth/exchange and /auth/verify endpoints without logging secrets.

.REQUIREMENTS
    - MCP_REMOTE_URL: Remote MCP server URL
    - EVENTICIOUS_BASE_URL: Eventicious API base URL
    - EVENTICIOUS_CLIENT_ID: Eventicious client ID
    - EVENTICIOUS_CLIENT_SECRET: Eventicious client secret

.EXAMPLE
    $env:MCP_REMOTE_URL="https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru"
    $env:EVENTICIOUS_BASE_URL="https://api-integration.eventicious.ru"
    $env:EVENTICIOUS_CLIENT_ID="..."
    $env:EVENTICIOUS_CLIENT_SECRET="..."
    .\scripts\smoke-auth-exchange.ps1
#>

param()

$envVars = @("MCP_REMOTE_URL", "EVENTICIOUS_BASE_URL", "EVENTICIOUS_CLIENT_ID", "EVENTICIOUS_CLIENT_SECRET")
$missing = @()
foreach ($v in $envVars) {
    if (-not (Get-Item -Path "Env:\$v" -ErrorAction SilentlyContinue)) {
        $missing += $v
    }
}

if ($missing.Count -gt 0) {
    Write-Host "SKIP: Missing env variables: $($missing -join ', ')" -ForegroundColor Yellow
    Write-Host "Set all required variables to run smoke:auth" -ForegroundColor Yellow
    exit 0
}

$BaseUrl = $env:MCP_REMOTE_URL
$baseUrlNormalized = $BaseUrl.TrimEnd('/')

Write-Host "Auth Exchange Smoke Test: $BaseUrl" -ForegroundColor Cyan

# 1. Test /auth/exchange
try {
    $exchangeBody = @{
        baseUrl = $env:EVENTICIOUS_BASE_URL
        clientId = $env:EVENTICIOUS_CLIENT_ID
        clientSecret = $env:EVENTICIOUS_CLIENT_SECRET
    } | ConvertTo-Json

    $exchangeResp = Invoke-RestMethod -Uri "$baseUrlNormalized/auth/exchange" -Method POST -ContentType "application/json" -Body $exchangeBody

    if (-not $exchangeResp.ok -or -not $exchangeResp.mcpToken) {
        Write-Host "FAIL: /auth/exchange did not return mcpToken" -ForegroundColor Red
        exit 1
    }

    Write-Host "PASS: /auth/exchange returned mcpToken (length: $($exchangeResp.mcpToken.Length))" -ForegroundColor Green
    $mcpToken = $exchangeResp.mcpToken

    # 2. Test /auth/verify with MCP token
    try {
        $verifyResp = Invoke-RestMethod -Uri "$baseUrlNormalized/auth/verify" -Method GET -Headers @{ Authorization = "Bearer $mcpToken" }

        if (-not $verifyResp.ok) {
            Write-Host "FAIL: /auth/verify returned ok=false" -ForegroundColor Red
            exit 1
        }

        Write-Host "PASS: /auth/verify returned ok=true, toolsCount: $($verifyResp.toolsCount)" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: /auth/verify error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "FAIL: /auth/exchange error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll auth smoke tests PASSED" -ForegroundColor Green