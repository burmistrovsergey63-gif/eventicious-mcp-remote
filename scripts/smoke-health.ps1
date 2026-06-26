# Smoke test: GET /health
# Usage: .\scripts\smoke-health.ps1

$baseUrl = "http://localhost:3000"
$url = "$baseUrl/health"

Write-Host "Testing GET $url" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Method GET
    Write-Host "Status: OK" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Status: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
