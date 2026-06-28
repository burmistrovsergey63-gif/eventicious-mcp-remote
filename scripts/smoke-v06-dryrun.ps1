# Smoke test: v0.6 Expo Pack + Gamification Fix
# Purpose: Verify all v0.6 tools work with dry_run=true
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
}

function Invoke-McpTool {
    param([string]$ToolName, [hashtable]$Arguments)
    $body = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/call"
        params = @{
            name = $ToolName
            arguments = $Arguments
        }
    } | ConvertTo-Json -Depth 5

    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json" -Headers $headers
        return $response
    } catch {
        Write-Host "ERROR calling $ToolName : $_" -ForegroundColor Red
        return $null
    }
}

# Test 1: tools/list - verify count
Write-Host "`n1. Testing tools/list..." -ForegroundColor Yellow
$body = @{
    jsonrpc = "2.0"
    id = 1
    method = "tools/list"
    params = @{}
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json" -Headers $headers
    $toolCount = $response.result.tools.Count
    Write-Host "   Tools count: $toolCount (expected: 74)" -ForegroundColor $(if ($toolCount -eq 74) { "Green" } else { "Red" })
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
}

# Test 2: eventicious_create_exhibitor dry_run
Write-Host "`n2. Testing eventicious_create_exhibitor (dry_run)..." -ForegroundColor Yellow
$result = Invoke-McpTool -ToolName "eventicious_create_exhibitor" -Arguments @{
    id = 900001
    name = "Test Exhibitor"
    address = "Test Address"
    site = "https://example.com"
    email = "test@example.com"
    phone = "+70000000000"
    details = "<p>Test details</p>"
    externalImagePath = "https://example.com/logo.png"
    representativesIds = @(1001, 1002)
    dry_run = $true
}
if ($result) {
    $preview = $result.result.content[0].text | ConvertFrom-Json
    Write-Host "   dry_run: $($preview.dry_run)" -ForegroundColor Green
}

# Test 3: eventicious_update_exhibitor dry_run
Write-Host "`n3. Testing eventicious_update_exhibitor (dry_run)..." -ForegroundColor Yellow
$result = Invoke-McpTool -ToolName "eventicious_update_exhibitor" -Arguments @{
    id = 900001
    name = "Updated Name"
    dry_run = $true
}
if ($result) {
    $preview = $result.result.content[0].text | ConvertFrom-Json
    Write-Host "   dry_run: $($preview.dry_run)" -ForegroundColor Green
}

# Test 4: eventicious_delete_exhibitor dry_run
Write-Host "`n4. Testing eventicious_delete_exhibitor (dry_run)..." -ForegroundColor Yellow
$result = Invoke-McpTool -ToolName "eventicious_delete_exhibitor" -Arguments @{
    id = 900001
    dry_run = $true
}
if ($result) {
    $preview = $result.result.content[0].text | ConvertFrom-Json
    Write-Host "   dry_run: $($preview.dry_run)" -ForegroundColor Green
}

# Test 5: eventicious_prepare_exhibitors_import
Write-Host "`n5. Testing eventicious_prepare_exhibitors_import..." -ForegroundColor Yellow
$result = Invoke-McpTool -ToolName "eventicious_prepare_exhibitors_import" -Arguments @{
    exhibitors = @(
        @{ id = 900001; name = "Exhibitor One"; site = "https://exhibitor1.com" },
        @{ id = 900002; name = "Exhibitor Two"; email = "info@exhibitor2.com" }
    )
}
if ($result) {
    $preview = $result.result.content[0].text | ConvertFrom-Json
    Write-Host "   total: $($preview.summary.total), create: $($preview.summary.createCount)" -ForegroundColor Green
}

# Test 6: eventicious_validate_exhibitor_plan
Write-Host "`n6. Testing eventicious_validate_exhibitor_plan..." -ForegroundColor Yellow
$result = Invoke-McpTool -ToolName "eventicious_validate_exhibitor_plan" -Arguments @{
    plan = @{
        create = @(
            @{ id = 900001; name = "New Exhibitor" }
        )
        update = @(
            @{ id = 900002; name = "Updated Name" }
        )
        delete = @(
            @{ id = 900003 }
        )
    }
}
if ($result) {
    $preview = $result.result.content[0].text | ConvertFrom-Json
    Write-Host "   valid: $($preview.valid), errors: $($preview.errors.Count)" -ForegroundColor Green
}

# Test 7: eventicious_validate_gamification_charge (positive)
Write-Host "`n7. Testing eventicious_validate_gamification_charge (positive)..." -ForegroundColor Yellow
$result = Invoke-McpTool -ToolName "eventicious_validate_gamification_charge" -Arguments @{
    externalId = 456
    scores = 100
    reason = "Test charge"
}
if ($result) {
    $preview = $result.result.content[0].text | ConvertFrom-Json
    Write-Host "   valid: $($preview.valid), operation: $($preview.operation)" -ForegroundColor Green
}

# Test 8: eventicious_validate_gamification_charge (negative)
Write-Host "`n8. Testing eventicious_validate_gamification_charge (negative)..." -ForegroundColor Yellow
$result = Invoke-McpTool -ToolName "eventicious_validate_gamification_charge" -Arguments @{
    externalId = 456
    scores = -50
    reason = "Test write-off"
}
if ($result) {
    $preview = $result.result.content[0].text | ConvertFrom-Json
    Write-Host "   valid: $($preview.valid), operation: $($preview.operation)" -ForegroundColor Green
}

# Test 9: eventicious_validate_gamification_charge (zero - should fail)
Write-Host "`n9. Testing eventicious_validate_gamification_charge (zero)..." -ForegroundColor Yellow
$result = Invoke-McpTool -ToolName "eventicious_validate_gamification_charge" -Arguments @{
    externalId = 456
    scores = 0
    reason = "Test zero"
}
if ($result) {
    $preview = $result.result.content[0].text | ConvertFrom-Json
    Write-Host "   valid: $($preview.valid) (expected: false)" -ForegroundColor $(if (-not $preview.valid) { "Green" } else { "Red" })
}

# Test 10: eventicious_add_manual_gamification_charge dry_run (positive)
Write-Host "`n10. Testing eventicious_add_manual_gamification_charge (positive, dry_run)..." -ForegroundColor Yellow
$result = Invoke-McpTool -ToolName "eventicious_add_manual_gamification_charge" -Arguments @{
    externalId = 456
    scores = 100
    reason = "Test charge"
    dry_run = $true
}
if ($result) {
    $preview = $result.result.content[0].text | ConvertFrom-Json
    Write-Host "   dry_run: $($preview.dry_run), operation: $($preview.operation)" -ForegroundColor Green
}

# Test 11: eventicious_add_manual_gamification_charge dry_run (negative)
Write-Host "`n11. Testing eventicious_add_manual_gamification_charge (negative, dry_run)..." -ForegroundColor Yellow
$result = Invoke-McpTool -ToolName "eventicious_add_manual_gamification_charge" -Arguments @{
    externalId = 456
    scores = -50
    reason = "Test write-off"
    dry_run = $true
}
if ($result) {
    $preview = $result.result.content[0].text | ConvertFrom-Json
    Write-Host "   dry_run: $($preview.dry_run), operation: $($preview.operation)" -ForegroundColor Green
}

Write-Host "`nSmoke test completed!" -ForegroundColor Cyan
