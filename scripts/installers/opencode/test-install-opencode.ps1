<#
.SYNOPSIS
    Tests install-opencode.ps1 and uninstall-opencode.ps1 in non-interactive mode.

.DESCRIPTION
    Creates a temporary directory, runs install/uninstall with fake values,
    validates JSON structure, and checks that existing MCP servers are preserved.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\test-install-opencode.ps1
#>

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot

Write-Host ""
Write-Host "Testing OpenCode Installer Scripts" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# --- Setup temp directory ---

$tempDir = Join-Path $env:TEMP "opencode-test-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
$testConfig = Join-Path $tempDir "opencode.json"

try {
    # --- Create a pre-existing opencode.json with another MCP server ---

    $existingConfig = @{
        mcp = @{
            "other-server" = @{
                type    = "remote"
                url     = "https://example.com/mcp"
                enabled = $true
            }
        }
        otherSetting = "preserved"
    }
    $existingConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $testConfig -Encoding UTF8

    Write-Host "1. Created test opencode.json with other-server" -ForegroundColor Yellow
    Write-Host ""

    # --- Run install ---

    Write-Host "2. Running install-opencode.ps1 (non-interactive)..." -ForegroundColor Yellow
    & "$scriptDir\install-opencode.ps1" `
        -NonInteractive `
        -Endpoint "https://fake-endpoint.example.com/mcp" `
        -McpToken "tok_test_fake_token_12345678" `
        -EventiciousClientId "cl-test-fake-client-id" `
        -EventiciousClientSecret "cs-test-fake-client-secret-xyz" `
        -EventiciousBaseUrl "https://fake-api.example.com" `
        -TargetPath $testConfig

    # --- Validate install ---

    Write-Host ""
    Write-Host "3. Validating install result..." -ForegroundColor Yellow
    $installed = Get-Content -LiteralPath $testConfig -Raw | ConvertFrom-Json

    # Check mcp.eventicious exists
    if (-not $installed.mcp.eventicious) {
        throw "FAIL: mcp.eventicious not found after install"
    }
    Write-Host "   PASS: mcp.eventicious exists" -ForegroundColor Green

    # Check eventicious fields
    $ev = $installed.mcp.eventicious
    if ($ev.type -ne "remote") { throw "FAIL: type != remote" }
    if ($ev.url -ne "https://fake-endpoint.example.com/mcp") { throw "FAIL: url mismatch" }
    if ($ev.enabled -ne $true) { throw "FAIL: enabled != true" }
    if ($ev.oauth -ne $false) { throw "FAIL: oauth != false" }
    if ($ev.timeout -ne 120000) { throw "FAIL: timeout != 120000" }
    Write-Host "   PASS: eventicious config fields correct" -ForegroundColor Green

    # Check headers
    if (-not $ev.headers.Authorization.StartsWith("Bearer ")) { throw "FAIL: Authorization missing Bearer prefix" }
    if ($ev.headers."x-eventicious-client-id" -ne "cl-test-fake-client-id") { throw "FAIL: client-id mismatch" }
    if ($ev.headers."x-eventicious-client-secret" -ne "cs-test-fake-client-secret-xyz") { throw "FAIL: client-secret mismatch" }
    if ($ev.headers."x-eventicious-base-url" -ne "https://fake-api.example.com") { throw "FAIL: base-url mismatch" }
    Write-Host "   PASS: headers correct" -ForegroundColor Green

    # Check other server preserved
    if (-not $installed.mcp."other-server") { throw "FAIL: other-server was removed" }
    if ($installed.mcp."other-server".url -ne "https://example.com/mcp") { throw "FAIL: other-server url changed" }
    Write-Host "   PASS: other MCP server preserved" -ForegroundColor Green

    # Check other settings preserved
    if ($installed.otherSetting -ne "preserved") { throw "FAIL: otherSetting was removed" }
    Write-Host "   PASS: other settings preserved" -ForegroundColor Green

    # Check backup was created
    $backups = Get-ChildItem -Path $tempDir -Filter "opencode.json.bak.*" -ErrorAction SilentlyContinue
    if (-not $backups -or $backups.Count -eq 0) { throw "FAIL: no backup created" }
    Write-Host "   PASS: backup created ($($backups.Count) file(s))" -ForegroundColor Green

    # --- Run uninstall ---

    Write-Host ""
    Write-Host "4. Running uninstall-opencode.ps1..." -ForegroundColor Yellow
    & "$scriptDir\uninstall-opencode.ps1" -TargetPath $testConfig

    # --- Validate uninstall ---

    Write-Host ""
    Write-Host "5. Validating uninstall result..." -ForegroundColor Yellow
    $uninstalled = Get-Content -LiteralPath $testConfig -Raw | ConvertFrom-Json

    # Check eventicious removed
    if ($uninstalled.mcp.eventicious) { throw "FAIL: mcp.eventicious still exists after uninstall" }
    Write-Host "   PASS: mcp.eventicious removed" -ForegroundColor Green

    # Check other server preserved
    if (-not $uninstalled.mcp."other-server") { throw "FAIL: other-server was removed during uninstall" }
    Write-Host "   PASS: other MCP server still preserved" -ForegroundColor Green

    # Check other settings preserved
    if ($uninstalled.otherSetting -ne "preserved") { throw "FAIL: otherSetting removed during uninstall" }
    Write-Host "   PASS: other settings still preserved" -ForegroundColor Green

    # Check JSON is valid
    $null = $uninstalled | ConvertTo-Json -Depth 10
    Write-Host "   PASS: JSON valid" -ForegroundColor Green

    # --- Summary ---

    Write-Host ""
    Write-Host "ALL TESTS PASSED" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "TEST FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cleaned up temp directory." -ForegroundColor Gray
}
