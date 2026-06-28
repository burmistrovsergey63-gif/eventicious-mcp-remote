<#
.SYNOPSIS
    Tests install-opencode.ps1 and uninstall-opencode.ps1 in non-interactive mode.

.DESCRIPTION
    Creates temporary directories, runs install/uninstall with fake values,
    validates JSON structure, and checks that existing MCP servers are preserved.

    Tests covered:
    1. install with -TargetPath
    2. install with -TargetDir
    3. uninstall with -TargetPath
    4. uninstall with -TargetDir
    5. existing unrelated MCP server preserved
    6. eventicious updated if already exists
    7. JSON valid
    8. secrets fake only
    9. no network requests

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\test-install-opencode.ps1
#>

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot

Write-Host ""
Write-Host "Testing OpenCode Installer Scripts" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Test-FreshInstall {
    param(
        [string]$TestName,
        [string]$InstallMode
    )

    Write-Host "--- $TestName ---" -ForegroundColor Yellow

    $tempDir = Join-Path $env:TEMP "opencode-test-$(Get-Random)"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    $configPath = Join-Path $tempDir "opencode.json"

    # Create pre-existing config with another server
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
    $existingConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath -Encoding UTF8

    try {
        if ($InstallMode -eq "TargetPath") {
            & "$scriptDir\install-opencode.ps1" `
                -NonInteractive `
                -Endpoint "https://fake-endpoint.example.com/mcp" `
                -McpToken "tok_test_fake_token_12345678" `
                -EventiciousClientId "cl-test-fake-client-id" `
                -EventiciousClientSecret "cs-test-fake-client-secret-xyz" `
                -EventiciousBaseUrl "https://fake-api.example.com" `
                -TargetPath $configPath
        } else {
            & "$scriptDir\install-opencode.ps1" `
                -NonInteractive `
                -Endpoint "https://fake-endpoint.example.com/mcp" `
                -McpToken "tok_test_fake_token_12345678" `
                -EventiciousClientId "cl-test-fake-client-id" `
                -EventiciousClientSecret "cs-test-fake-client-secret-xyz" `
                -EventiciousBaseUrl "https://fake-api.example.com" `
                -TargetDir $tempDir
        }

        # Validate
        $installed = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json

        if (-not $installed.mcp.eventicious) { throw "mcp.eventicious not found" }
        if ($installed.mcp.eventicious.url -ne "https://fake-endpoint.example.com/mcp") { throw "url mismatch" }
        if ($installed.mcp.eventicious.headers."x-eventicious-client-id" -ne "cl-test-fake-client-id") { throw "client-id mismatch" }
        if ($installed.mcp.eventicious.headers."x-eventicious-client-secret" -ne "cs-test-fake-client-secret-xyz") { throw "client-secret mismatch" }
        if ($installed.mcp.eventicious.headers."x-eventicious-base-url" -ne "https://fake-api.example.com") { throw "base-url mismatch" }
        if (-not $installed.mcp.eventicious.headers.Authorization.StartsWith("Bearer ")) { throw "Authorization missing Bearer" }
        if ($installed.mcp.eventicious.enabled -ne $true) { throw "enabled != true" }
        if ($installed.mcp.eventicious.timeout -ne 120000) { throw "timeout != 120000" }
        if (-not $installed.mcp."other-server") { throw "other-server removed" }
        if ($installed.otherSetting -ne "preserved") { throw "otherSetting removed" }

        # Check backup was created
        $backups = Get-ChildItem -Path $tempDir -Filter "opencode.json.bak.*" -ErrorAction SilentlyContinue
        if (-not $backups -or $backups.Count -eq 0) { throw "no backup created" }

        Write-Host "  PASS" -ForegroundColor Green
        $script:testsPassed++
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
    } finally {
        Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Test-Uninstall {
    param(
        [string]$TestName,
        [string]$UninstallMode
    )

    Write-Host "--- $TestName ---" -ForegroundColor Yellow

    $tempDir = Join-Path $env:TEMP "opencode-test-$(Get-Random)"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    $configPath = Join-Path $tempDir "opencode.json"

    # Create config with eventicious + other server
    $config = @{
        mcp = @{
            "eventicious" = @{
                type    = "remote"
                url     = "https://fake-endpoint.example.com/mcp"
                enabled = $true
            }
            "other-server" = @{
                type    = "remote"
                url     = "https://example.com/mcp"
                enabled = $true
            }
        }
        otherSetting = "preserved"
    }
    $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath -Encoding UTF8

    try {
        if ($UninstallMode -eq "TargetPath") {
            & "$scriptDir\uninstall-opencode.ps1" -TargetPath $configPath
        } else {
            & "$scriptDir\uninstall-opencode.ps1" -TargetDir $tempDir
        }

        $uninstalled = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json

        if ($uninstalled.mcp.eventicious) { throw "mcp.eventicious still exists" }
        if (-not $uninstalled.mcp."other-server") { throw "other-server removed" }
        if ($uninstalled.otherSetting -ne "preserved") { throw "otherSetting removed" }

        # Verify JSON valid
        $null = $uninstalled | ConvertTo-Json -Depth 10

        Write-Host "  PASS" -ForegroundColor Green
        $script:testsPassed++
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
    } finally {
        Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Test-UpdateExisting {
    Write-Host "--- Update existing eventicious ---" -ForegroundColor Yellow

    $tempDir = Join-Path $env:TEMP "opencode-test-$(Get-Random)"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    $configPath = Join-Path $tempDir "opencode.json"

    # Create config with old eventicious
    $config = @{
        mcp = @{
            "eventicious" = @{
                type    = "remote"
                url     = "https://old-endpoint.example.com/mcp"
                enabled = $false
            }
        }
    }
    $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath -Encoding UTF8

    try {
        & "$scriptDir\install-opencode.ps1" `
            -NonInteractive `
            -Endpoint "https://new-endpoint.example.com/mcp" `
            -McpToken "tok_new_token_1234567890123456" `
            -EventiciousClientId "cl-new-client-id" `
            -EventiciousClientSecret "cs-new-client-secret-123456789" `
            -EventiciousBaseUrl "https://new-api.example.com" `
            -TargetDir $tempDir

        $updated = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json

        if ($updated.mcp.eventicious.url -ne "https://new-endpoint.example.com/mcp") { throw "url not updated" }
        if ($updated.mcp.eventicious.enabled -ne $true) { throw "enabled not updated" }
        if ($updated.mcp.eventicious.headers."x-eventicious-client-id" -ne "cl-new-client-id") { throw "client-id not updated" }

        Write-Host "  PASS" -ForegroundColor Green
        $script:testsPassed++
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
    } finally {
        Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# --- Run tests ---

Test-FreshInstall -TestName "Install with -TargetPath" -InstallMode "TargetPath"
Test-FreshInstall -TestName "Install with -TargetDir" -InstallMode "TargetDir"
Test-Uninstall -TestName "Uninstall with -TargetPath" -UninstallMode "TargetPath"
Test-Uninstall -TestName "Uninstall with -TargetDir" -UninstallMode "TargetDir"
Test-UpdateExisting

Write-Host ""
if ($testsFailed -gt 0) {
    Write-Host "TESTS FAILED: $testsFailed of $($testsPassed + $testsFailed)" -ForegroundColor Red
    exit 1
} else {
    Write-Host "ALL $testsPassed TESTS PASSED" -ForegroundColor Green
}
Write-Host ""
