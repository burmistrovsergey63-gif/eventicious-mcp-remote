<#
.SYNOPSIS
    Builds eventicious-mcp-opencode-setup.zip archive.

.DESCRIPTION
    Packages install-opencode.ps1, uninstall-opencode.ps1, and README.md into a ZIP file.

.PARAMETER OutputDir
    Output directory for the ZIP. Default: dist\

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\build-opencode-setup-zip.ps1
#>
param(
    [string]$OutputDir = "dist"
)

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot

Write-Host ""
Write-Host "Building Eventicious MCP OpenCode Setup ZIP" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- Ensure output directory ---

$OutputDir = Resolve-Path -Path $OutputDir -ErrorAction SilentlyContinue
if (-not $OutputDir) {
    $OutputDir = Join-Path (Get-Location) "dist"
}
if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# --- Collect files ---

$files = @(
    @{ Name = "install-opencode.ps1";   Source = Join-Path $scriptDir "install-opencode.ps1" },
    @{ Name = "uninstall-opencode.ps1"; Source = Join-Path $scriptDir "uninstall-opencode.ps1" },
    @{ Name = "README.md";              Source = Join-Path $scriptDir "README.md" }
)

foreach ($f in $files) {
    if (-not (Test-Path -LiteralPath $f.Source)) {
        throw "Required file not found: $($f.Name)"
    }
}

# --- Create ZIP ---

$zipPath = Join-Path $OutputDir "eventicious-mcp-opencode-setup.zip"

if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

$tempDir = Join-Path $env:TEMP "opencode-setup-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    foreach ($f in $files) {
        Copy-Item -LiteralPath $f.Source -Destination (Join-Path $tempDir $f.Name) -Force
    }

    Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $zipPath -Force

    $size = (Get-Item -LiteralPath $zipPath).Length
    Write-Host "ZIP created: $zipPath ($([math]::Round($size / 1KB, 1)) KB)" -ForegroundColor Green
} finally {
    Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Contents:" -ForegroundColor Gray
$files | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
Write-Host ""
