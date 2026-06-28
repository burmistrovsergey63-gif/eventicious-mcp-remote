<#
.SYNOPSIS
    Installs Eventicious MCP server configuration for OpenCode.

.DESCRIPTION
    Adds or updates the mcp.eventicious section in opencode.json.
    Supports interactive and non-interactive (parameter-based) modes.

.PARAMETER Endpoint
    MCP endpoint URL. Default: https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp

.PARAMETER McpToken
    MCP access token. If not provided in non-interactive mode, prompts user.

.PARAMETER EventiciousClientId
    Eventicious client ID. If not provided in non-interactive mode, prompts user.

.PARAMETER EventiciousClientSecret
    Eventicious client secret. If not provided in non-interactive mode, prompts user.

.PARAMETER EventiciousBaseUrl
    Eventicious base URL. Default: https://api-integration.eventicious.ru

.PARAMETER TargetPath
    Path to opencode.json. Default: .\opencode.json

.PARAMETER NonInteractive
    If set, uses parameter values without prompting. Missing required parameters cause an error.

.EXAMPLE
    # Interactive mode
    powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1

.EXAMPLE
    # Non-interactive mode
    powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 -NonInteractive -McpToken "tok_xxx" -EventiciousClientId "cl-xxx" -EventiciousClientSecret "cs-xxx"
#>
param(
    [string]$Endpoint = "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
    [string]$McpToken,
    [string]$EventiciousClientId,
    [string]$EventiciousClientSecret,
    [string]$EventiciousBaseUrl = "https://api-integration.eventicious.ru",
    [string]$TargetPath = ".\opencode.json",
    [switch]$NonInteractive
)

$ErrorActionPreference = "Stop"

function Mask-Secret {
    param([string]$Value)
    if (-not $Value -or $Value.Length -lt 8) { return "****" }
    return $Value.Substring(0, 3) + "****" + $Value.Substring($Value.Length - 3)
}

function Read-Secret {
    param([string]$Prompt)
    Write-Host $Prompt -NoNewline
    $secret = ""
    while ($true) {
        $key = [Console]::ReadKey($true)
        if ($key.Key -eq "Enter") { break }
        if ($key.Key -eq "Backspace") {
            if ($secret.Length -gt 0) {
                $secret = $secret.Substring(0, $secret.Length - 1)
                Write-Host "`b `b" -NoNewline
            }
        } else {
            $secret += $key.KeyChar
            Write-Host "*" -NoNewline
        }
    }
    Write-Host ""
    return $secret
}

Write-Host ""
Write-Host "Eventicious MCP Installer for OpenCode" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# --- Collect parameters ---

if ($NonInteractive) {
    if (-not $McpToken) { throw "McpToken is required in NonInteractive mode. Use -McpToken parameter." }
    if (-not $EventiciousClientId) { throw "EventiciousClientId is required in NonInteractive mode. Use -EventiciousClientId parameter." }
    if (-not $EventiciousClientSecret) { throw "EventiciousClientSecret is required in NonInteractive mode. Use -EventiciousClientSecret parameter." }
} else {
    Write-Host "Enter connection details (press Enter for defaults):" -ForegroundColor Yellow
    Write-Host ""

    $inputEndpoint = Read-Host "MCP endpoint [$Endpoint]"
    if ($inputEndpoint) { $Endpoint = $inputEndpoint }

    $McpToken = Read-Secret -Prompt "MCP_ACCESS_TOKEN (secret): "
    if (-not $McpToken) { throw "MCP_ACCESS_TOKEN is required." }

    $inputClientId = Read-Host "Eventicious CLIENT_ID"
    if ($inputClientId) { $EventiciousClientId = $inputClientId }
    if (-not $EventiciousClientId) { throw "Eventicious CLIENT_ID is required." }

    $EventiciousClientSecret = Read-Secret -Prompt "Eventicious CLIENT_SECRET (secret): "
    if (-not $EventiciousClientSecret) { throw "Eventicious CLIENT_SECRET is required." }

    $inputBaseUrl = Read-Host "Eventicious base URL [$EventiciousBaseUrl]"
    if ($inputBaseUrl) { $EventiciousBaseUrl = $inputBaseUrl }
}

# --- Resolve target path ---

$TargetPath = Resolve-Path -Path $TargetPath -ErrorAction SilentlyContinue
if (-not $TargetPath) {
    $TargetPath = Join-Path (Get-Location) "opencode.json"
}

Write-Host ""
Write-Host "Target: $TargetPath" -ForegroundColor Gray

# --- Backup existing file ---

if (Test-Path -LiteralPath $TargetPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$TargetPath.bak.$timestamp"
    Copy-Item -LiteralPath $TargetPath -Destination $backupPath -Force
    Write-Host "Backup: $backupPath" -ForegroundColor Gray

    $existing = Get-Content -LiteralPath $TargetPath -Raw | ConvertFrom-Json
} else {
    $existing = @{ mcp = @{} }
}

# --- Ensure mcp property exists ---

if (-not $existing.mcp) {
    $existing | Add-Member -NotePropertyName "mcp" -NotePropertyValue @{} -Force
}

# --- Build eventicious config ---

$eventiciousConfig = @{
    type    = "remote"
    url     = $Endpoint
    enabled = $true
    oauth   = $false
    timeout = 120000
    headers = @{
        "Authorization"                = "Bearer $McpToken"
        "x-eventicious-client-id"     = $EventiciousClientId
        "x-eventicious-client-secret" = $EventiciousClientSecret
        "x-eventicious-base-url"      = $EventiciousBaseUrl
    }
}

# --- Add/update eventicious ---

$existing.mcp | Add-Member -NotePropertyName "eventicious" -NotePropertyValue $eventiciousConfig -Force

# --- Write JSON ---

$json = $existing | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($TargetPath, $json, [System.Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "Eventicious MCP installed for OpenCode." -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Endpoint:    $Endpoint"
Write-Host "  MCP Token:   $(Mask-Secret $McpToken)"
Write-Host "  Client ID:   $EventiciousClientId"
Write-Host "  Client Sec:  $(Mask-Secret $EventiciousClientSecret)"
Write-Host "  Base URL:    $EventiciousBaseUrl"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart OpenCode."
Write-Host "  2. Ask OpenCode:"
Write-Host "     Используй eventicious MCP. Проверь tools/list и eventicious_auth_check."
Write-Host "  3. Expected: tools/list=68, auth_check=success"
Write-Host ""
