<#
.SYNOPSIS
    Removes Eventicious MCP server configuration from opencode.json.

.DESCRIPTION
    Removes only the mcp.eventicious section from opencode.json.
    Preserves all other settings and MCP servers.

.PARAMETER TargetDir
    Path to the OpenCode project folder. Reads <TargetDir>\opencode.json.
    Takes precedence over interactive prompt, but not over -TargetPath.

.PARAMETER TargetPath
    Full path to opencode.json. Takes precedence over -TargetDir.
    Kept for backward compatibility.

.EXAMPLE
    # Interactive mode - installer asks for project folder
    powershell -ExecutionPolicy Bypass -File .\uninstall-opencode.ps1

.EXAMPLE
    # Specify project folder directly
    powershell -ExecutionPolicy Bypass -File .\uninstall-opencode.ps1 -TargetDir "C:\Users\me\my-project"
#>
param(
    [string]$TargetDir,
    [string]$TargetPath
)

$ErrorActionPreference = "Stop"

function Resolve-TargetFile {
    if ($TargetPath) {
        return $TargetPath
    }

    if ($TargetDir) {
        return Join-Path $TargetDir "opencode.json"
    }

    # Interactive mode
    $currentDir = Get-Location
    $dirName = Split-Path $currentDir -Leaf
    $parentDir = Split-Path $currentDir -Parent
    $isInstallerFolder = $dirName -match "eventicious-mcp-opencode-setup|opencode"
    $hasParent = -not [string]::IsNullOrEmpty($parentDir)

    Write-Host ""
    Write-Host "Select OpenCode project folder" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""

    $selectedDir = $null

    if ($isInstallerFolder -and $hasParent) {
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
            $selectedDir = $inputDir.TrimEnd('\').TrimEnd('/')
        }
    }

    if (-not $selectedDir) {
        throw "No target folder specified. Use -TargetDir or -TargetPath parameter."
    }

    return Join-Path $selectedDir "opencode.json"
}

Write-Host ""
Write-Host "Eventicious MCP Uninstaller for OpenCode" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# --- Resolve target file ---

$TargetFile = Resolve-TargetFile

if (-not (Test-Path -LiteralPath $TargetFile)) {
    Write-Host "opencode.json not found at: $TargetFile" -ForegroundColor Red
    exit 1
}

# --- Backup ---

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$TargetFile.bak.$timestamp"
Copy-Item -LiteralPath $TargetFile -Destination $backupPath -Force
Write-Host "Backup: $backupPath" -ForegroundColor Gray

# --- Load and modify ---

$existing = Get-Content -LiteralPath $TargetFile -Raw | ConvertFrom-Json

if (-not $existing.mcp -or -not $existing.mcp.eventicious) {
    Write-Host "mcp.eventicious not found. Nothing to remove." -ForegroundColor Yellow
    exit 0
}

# Remove eventicious
$existing.mcp.PSObject.Properties.Remove("eventicious")

# Clean up empty mcp object
$remainingProps = @($existing.mcp.PSObject.Properties | ForEach-Object { $_.Name })
if ($remainingProps.Count -eq 0) {
    $existing.PSObject.Properties.Remove("mcp")
    Write-Host "Removed mcp.eventicious. mcp object is now empty (removed)." -ForegroundColor Gray
} else {
    Write-Host "Removed mcp.eventicious. Other MCP servers preserved: $($remainingProps -join ', ')" -ForegroundColor Gray
}

# --- Write JSON ---

$json = $existing | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($TargetFile, $json, [System.Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "Eventicious MCP removed from OpenCode config." -ForegroundColor Green
Write-Host "Restart OpenCode to apply changes." -ForegroundColor Yellow
Write-Host ""
