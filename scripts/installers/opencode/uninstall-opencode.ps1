<#
.SYNOPSIS
    Removes Eventicious MCP server configuration from opencode.json.

.DESCRIPTION
    Removes only the mcp.eventicious section from opencode.json.
    Preserves all other settings and MCP servers.

.PARAMETER TargetPath
    Path to opencode.json. Default: .\opencode.json

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\uninstall-opencode.ps1
#>
param(
    [string]$TargetPath = ".\opencode.json"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Eventicious MCP Uninstaller for OpenCode" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# --- Resolve target path ---

$TargetPath = Resolve-Path -Path $TargetPath -ErrorAction SilentlyContinue
if (-not $TargetPath) {
    $TargetPath = Join-Path (Get-Location) "opencode.json"
}

if (-not (Test-Path -LiteralPath $TargetPath)) {
    Write-Host "opencode.json not found at: $TargetPath" -ForegroundColor Red
    exit 1
}

# --- Backup ---

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$TargetPath.bak.$timestamp"
Copy-Item -LiteralPath $TargetPath -Destination $backupPath -Force
Write-Host "Backup: $backupPath" -ForegroundColor Gray

# --- Load and modify ---

$existing = Get-Content -LiteralPath $TargetPath -Raw | ConvertFrom-Json

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
[System.IO.File]::WriteAllText($TargetPath, $json, [System.Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "Eventicious MCP removed from OpenCode config." -ForegroundColor Green
Write-Host "Restart OpenCode to apply changes." -ForegroundColor Yellow
Write-Host ""
