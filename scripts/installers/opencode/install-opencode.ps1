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

.PARAMETER TargetDir
    Path to the OpenCode project folder. Installer writes <TargetDir>\opencode.json.
    Takes precedence over interactive prompt, but not over -TargetPath.

.PARAMETER TargetPath
    Full path to opencode.json. Takes precedence over -TargetDir.
    Kept for backward compatibility.

.PARAMETER NonInteractive
    If set, uses parameter values without prompting. Missing required parameters cause an error.

.EXAMPLE
    # Interactive mode - installer asks for project folder
    powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1

.EXAMPLE
    # Specify project folder directly
    powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 -TargetDir "C:\Users\me\my-project"

.EXAMPLE
    # Non-interactive mode
    powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 -NonInteractive -McpToken "tok_xxx" -EventiciousClientId "cl-xxx" -EventiciousClientSecret "cs-xxx" -TargetDir "C:\Users\me\my-project"
#>
param(
    [string]$Endpoint = "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
    [string]$McpToken,
    [string]$EventiciousClientId,
    [string]$EventiciousClientSecret,
    [string]$EventiciousBaseUrl = "https://api-integration.eventicious.ru",
    [string]$TargetDir,
    [string]$TargetPath,
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

function Resolve-TargetFile {
    # Priority: TargetPath > TargetDir > interactive
    if ($TargetPath) {
        return $TargetPath
    }

    $selectedDir = $null

    if ($TargetDir) {
        $selectedDir = $TargetDir
    } elseif (-not $NonInteractive) {
        # Detect possible parent folder
        $currentDir = Get-Location
        $dirName = Split-Path $currentDir -Leaf
        $parentDir = Split-Path $currentDir -Parent

        $isInstallerFolder = $dirName -match "eventicious-mcp-opencode-setup|opencode"
        $hasParent = -not [string]::IsNullOrEmpty($parentDir)

        Write-Host ""
        Write-Host "Select OpenCode project folder" -ForegroundColor Cyan
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "opencode.json must be in the root of the project you open in OpenCode." -ForegroundColor Gray
        Write-Host "Example: C:\Users\you\Desktop\my-project\opencode.json" -ForegroundColor Gray
        Write-Host ""

        if ($isInstallerFolder -and $hasParent) {
            # Suggest parent folder
            $defaultDir = $parentDir
            Write-Host "Detected possible OpenCode project folder:" -ForegroundColor Yellow
            Write-Host "  $defaultDir" -ForegroundColor White
            Write-Host ""
            $answer = Read-Host "Use this folder? [Y/n]"

            if ($answer -eq "" -or $answer -eq "Y" -or $answer -eq "y") {
                $selectedDir = $defaultDir
            }
        }

        if (-not $selectedDir) {
            $inputDir = Read-Host "Enter OpenCode project folder path"
            if ($inputDir) {
                $selectedDir = $inputDir
            }
        }
    }

    if (-not $selectedDir) {
        throw "No target folder specified. Use -TargetDir or -TargetPath parameter."
    }

    # Validate and resolve directory
    $selectedDir = $selectedDir.TrimEnd('\').TrimEnd('/')

    if (-not (Test-Path -LiteralPath $selectedDir -PathType Container)) {
        Write-Host ""
        Write-Host "Folder does not exist: $selectedDir" -ForegroundColor Yellow
        $create = Read-Host "Create this folder? [y/N]"
        if ($create -eq "Y" -or $create -eq "y") {
            New-Item -ItemType Directory -Path $selectedDir -Force | Out-Null
            Write-Host "Created: $selectedDir" -ForegroundColor Green
        } else {
            throw "Installation cancelled. Folder does not exist: $selectedDir"
        }
    }

    # Warn if user selected the installer folder itself
    $leaf = Split-Path $selectedDir -Leaf
    if ($leaf -match "eventicious-mcp-opencode-setup|opencode-setup") {
        Write-Host ""
        Write-Host "Warning: You selected the installer folder, not your OpenCode project folder." -ForegroundColor Yellow
        $confirm = Read-Host "Continue anyway? [y/N]"
        if ($confirm -ne "Y" -and $confirm -ne "y") {
            throw "Installation cancelled."
        }
    }

    return Join-Path $selectedDir "opencode.json"
}

Write-Host ""
Write-Host "Eventicious MCP Installer for OpenCode" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# --- Collect credentials ---

if ($NonInteractive) {
    if (-not $McpToken) { throw "McpToken is required in NonInteractive mode. Use -McpToken parameter." }
    if (-not $EventiciousClientId) { throw "EventiciousClientId is required in NonInteractive mode. Use -EventiciousClientId parameter." }
    if (-not $EventiciousClientSecret) { throw "EventiciousClientSecret is required in NonInteractive mode. Use -EventiciousClientSecret parameter." }
} else {
    Write-Host ""
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

# --- Resolve target file ---

$TargetFile = Resolve-TargetFile
$TargetPathResolved = Resolve-Path -Path $TargetFile -ErrorAction SilentlyContinue
if (-not $TargetPathResolved) {
    $TargetPathResolved = $TargetFile
}

Write-Host ""
Write-Host "Config file: $TargetPathResolved" -ForegroundColor Gray

# --- Backup existing file ---

if (Test-Path -LiteralPath $TargetPathResolved) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$TargetPathResolved.bak.$timestamp"
    Copy-Item -LiteralPath $TargetPathResolved -Destination $backupPath -Force
    Write-Host "Backup: $backupPath" -ForegroundColor Gray

    $existing = Get-Content -LiteralPath $TargetPathResolved -Raw | ConvertFrom-Json
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
[System.IO.File]::WriteAllText($TargetPathResolved, $json, [System.Text.UTF8Encoding]::new($false))

# --- Success output ---

$projectDir = Split-Path $TargetPathResolved -Parent

Write-Host ""
Write-Host "Eventicious MCP installed for OpenCode." -ForegroundColor Green
Write-Host ""
Write-Host "Config file:" -ForegroundColor Cyan
Write-Host "  $TargetPathResolved"
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Endpoint:    $Endpoint"
Write-Host "  MCP Token:   $(Mask-Secret $McpToken)"
Write-Host "  Client ID:   $EventiciousClientId"
Write-Host "  Client Sec:  $(Mask-Secret $EventiciousClientSecret)"
Write-Host "  Base URL:    $EventiciousBaseUrl"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open this folder in OpenCode:"
Write-Host "     $projectDir"
Write-Host "  2. Restart OpenCode if it is already open."
Write-Host "  3. Ask OpenCode:"
Write-Host '     Используй eventicious MCP. Проверь tools/list и eventicious_auth_check.'
Write-Host "  4. Expected: tools/list=75, auth_check=success"
Write-Host ""
