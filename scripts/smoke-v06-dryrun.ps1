# Smoke test: v0.6 Expo Pack + Gamification Fix
# Purpose: Verify all v0.6 tools work with dry_run=true (no real Eventicious calls)
# Usage: .\scripts\smoke-v06-dryrun.ps1 -BaseUrl "https://your-app.layero.ru" -McpAccessToken "your-token"

param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,
    [Parameter(Mandatory=$true)]
    [string]$McpAccessToken
)

$baseUrl = $BaseUrl.TrimEnd('/')
$url = "$baseUrl/mcp"

Write-Host "v0.6 Smoke Test: $url" -ForegroundColor Cyan
Write-Host "Testing expo tools and gamification validation..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $McpAccessToken"
    "x-eventicious-client-id" = "test-client-id"
    "x-eventicious-client-secret" = "test-client-secret"
    "Accept" = "application/json, text/event-stream"
}

$script:testCount = 0
$script:passCount = 0
$script:failCount = 0

function Invoke-McpRaw {
    param([string]$ToolName, [hashtable]$Arguments)
    $body = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/call"
        params = @{
            name = $ToolName
            arguments = $Arguments
        }
    } | ConvertTo-Json -Depth 10

    try {
        $resp = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json; charset=utf-8" -Headers $headers -UseBasicParsing
        $raw = $resp.Content
        # SSE format: "event: message\ndata: {...}\n\n"
        # Extract JSON from "data: " line
        $lines = $raw -split "`n"
        foreach ($line in $lines) {
            if ($line -match '^data:\s*(.+)$') {
                return ($Matches[1] | ConvertFrom-Json)
            }
        }
        # Fallback: try parsing as plain JSON
        return ($raw | ConvertFrom-Json)
    } catch {
        Write-Host "  ERROR calling ${ToolName}: $_" -ForegroundColor Red
        return $null
    }
}

function Test-Check {
    param([string]$Name, [bool]$Condition, [string]$Detail)
    $script:testCount++
    if ($Condition) {
        $script:passCount++
        Write-Host "  PASS $Name : $Detail" -ForegroundColor Green
    } else {
        $script:failCount++
        Write-Host "  FAIL $Name : $Detail" -ForegroundColor Red
    }
}

# === Test 1: tools/list ===
Write-Host "`n--- Test 1: tools/list ---" -ForegroundColor Yellow
$listBody = @{
    jsonrpc = "2.0"
    id = 1
    method = "tools/list"
    params = @{}
} | ConvertTo-Json -Depth 5

try {
    $resp = Invoke-WebRequest -Uri $url -Method POST -Body $listBody -ContentType "application/json; charset=utf-8" -Headers $headers -UseBasicParsing
    $raw = $resp.Content
    $lines = $raw -split "`n"
    $listJson = $null
    foreach ($line in $lines) {
        if ($line -match '^data:\s*(.+)$') {
            $listJson = ($Matches[1] | ConvertFrom-Json)
            break
        }
    }
    if (-not $listJson) { $listJson = ($raw | ConvertFrom-Json) }

    $toolCount = $listJson.result.tools.Count
    $toolNames = $listJson.result.tools | ForEach-Object { $_.name }
    Test-Check "tools_count" ($toolCount -eq 74) "count=$toolCount (expected=74)"

    $v06Names = @(
        "eventicious_create_exhibitor",
        "eventicious_update_exhibitor",
        "eventicious_delete_exhibitor",
        "eventicious_prepare_exhibitors_import",
        "eventicious_validate_exhibitor_plan",
        "eventicious_validate_gamification_charge"
    )
    foreach ($n in $v06Names) {
        Test-Check "has_$n" ($toolNames -contains $n) $n
    }
    Test-Check "has_eventicious_add_manual_gamification_charge" ($toolNames -contains "eventicious_add_manual_gamification_charge") "legacy tool still present"
} catch {
    Write-Host "  ERROR: $_" -ForegroundColor Red
}

# === Test 2: create_exhibitor dry_run ===
Write-Host "`n--- Test 2: create_exhibitor dry_run ---" -ForegroundColor Yellow
$r = Invoke-McpRaw -ToolName "eventicious_create_exhibitor" -Arguments @{
    id = 900001; name = "Test"; address = "Addr"; site = "https://ex.com"
    email = "t@ex.com"; phone = "+70000000000"; details = "<p>Hi</p>"
    externalImagePath = "https://ex.com/logo.png"; representativesIds = @(1001)
    dry_run = $true
}
if ($r) {
    $d = $r.result.content[0].text | ConvertFrom-Json
    Test-Check "create_exhibitor_dry_run" ($d.dry_run -eq $true) "dry_run=true, endpoint=$($d.endpoint)"
}

# === Test 3: update_exhibitor dry_run ===
Write-Host "`n--- Test 3: update_exhibitor dry_run ---" -ForegroundColor Yellow
$r = Invoke-McpRaw -ToolName "eventicious_update_exhibitor" -Arguments @{
    id = 900001; name = "Updated"; dry_run = $true
}
if ($r) {
    $d = $r.result.content[0].text | ConvertFrom-Json
    Test-Check "update_exhibitor_dry_run" ($d.dry_run -eq $true) "dry_run=true, endpoint=$($d.endpoint)"
}

# === Test 4: delete_exhibitor dry_run (no danger_confirm) ===
Write-Host "`n--- Test 4: delete_exhibitor dry_run (no danger_confirm) ---" -ForegroundColor Yellow
$r = Invoke-McpRaw -ToolName "eventicious_delete_exhibitor" -Arguments @{
    id = 900001; dry_run = $true
}
if ($r) {
    $d = $r.result.content[0].text | ConvertFrom-Json
    Test-Check "delete_exhibitor_dry_run" ($d.dry_run -eq $true) "dry_run=true, endpoint=$($d.endpoint)"
}

# === Test 5: prepare_exhibitors_import ===
Write-Host "`n--- Test 5: prepare_exhibitors_import ---" -ForegroundColor Yellow
$r = Invoke-McpRaw -ToolName "eventicious_prepare_exhibitors_import" -Arguments @{
    exhibitors = @(
        @{ id = 900001; name = "Ex One"; site = "https://ex1.com" },
        @{ id = 900002; name = "Ex Two"; email = "info@ex2.com" }
    )
}
if ($r) {
    $d = $r.result.content[0].text | ConvertFrom-Json
    Test-Check "prepare_import" ($d.summary.total -eq 2) "total=$($d.summary.total), create=$($d.summary.createCount)"
}

# === Test 6: validate_exhibitor_plan ===
Write-Host "`n--- Test 6: validate_exhibitor_plan ---" -ForegroundColor Yellow
$r = Invoke-McpRaw -ToolName "eventicious_validate_exhibitor_plan" -Arguments @{
    plan = @{
        create = @(@{ id = 900001; name = "New" })
        update = @(@{ id = 900002; name = "Upd" })
        delete = @(@{ id = 900003 })
    }
}
if ($r) {
    $d = $r.result.content[0].text | ConvertFrom-Json
    Test-Check "validate_plan" ($d.valid -eq $true) "valid=$($d.valid), errors=$($d.errors.Count)"
}

# === Test 7: gamification validate positive ===
Write-Host "`n--- Test 7: gamification validate (positive) ---" -ForegroundColor Yellow
$r = Invoke-McpRaw -ToolName "eventicious_validate_gamification_charge" -Arguments @{
    externalId = 456; scores = 100; reason = "Test charge"
}
if ($r) {
    $d = $r.result.content[0].text | ConvertFrom-Json
    Test-Check "gamification_positive" ($d.valid -eq $true -and $d.operation -eq "charge") "valid=$($d.valid), operation=$($d.operation)"
}

# === Test 8: gamification validate negative ===
Write-Host "`n--- Test 8: gamification validate (negative) ---" -ForegroundColor Yellow
$r = Invoke-McpRaw -ToolName "eventicious_validate_gamification_charge" -Arguments @{
    externalId = 456; scores = -50; reason = "Test write-off"
}
if ($r) {
    $d = $r.result.content[0].text | ConvertFrom-Json
    Test-Check "gamification_negative" ($d.valid -eq $true -and $d.operation -eq "write-off") "valid=$($d.valid), operation=$($d.operation)"
}

# === Test 9: gamification validate zero (must fail) ===
Write-Host "`n--- Test 9: gamification validate (zero = invalid) ---" -ForegroundColor Yellow
$r = Invoke-McpRaw -ToolName "eventicious_validate_gamification_charge" -Arguments @{
    externalId = 456; scores = 0; reason = "Test zero"
}
if ($r) {
    $d = $r.result.content[0].text | ConvertFrom-Json
    Test-Check "gamification_zero_blocked" ($d.valid -eq $false) "valid=$($d.valid) (expected=false)"
}

# === Test 10: gamification charge dry_run (positive) ===
Write-Host "`n--- Test 10: gamification charge (positive, dry_run) ---" -ForegroundColor Yellow
$r = Invoke-McpRaw -ToolName "eventicious_add_manual_gamification_charge" -Arguments @{
    externalId = 456; scores = 100; reason = "Test charge"; dry_run = $true
}
if ($r) {
    $d = $r.result.content[0].text | ConvertFrom-Json
    Test-Check "gamification_charge_positive_dry_run" ($d.dry_run -eq $true -and $d.operation -eq "charge") "dry_run=$($d.dry_run), operation=$($d.operation)"
}

# === Test 11: gamification charge dry_run (negative) ===
Write-Host "`n--- Test 11: gamification charge (negative, dry_run) ---" -ForegroundColor Yellow
$r = Invoke-McpRaw -ToolName "eventicious_add_manual_gamification_charge" -Arguments @{
    externalId = 456; scores = -50; reason = "Test write-off"; dry_run = $true
}
if ($r) {
    $d = $r.result.content[0].text | ConvertFrom-Json
    Test-Check "gamification_charge_negative_dry_run" ($d.dry_run -eq $true -and $d.operation -eq "write-off") "dry_run=$($d.dry_run), operation=$($d.operation)"
}

# === Summary ===
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TOTAL: $($script:testCount) | PASS: $($script:passCount) | FAIL: $($script:failCount)" -ForegroundColor $(if ($script:failCount -eq 0) { "Green" } else { "Red" })
Write-Host "========================================" -ForegroundColor Cyan
