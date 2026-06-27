<#
.SYNOPSIS
    v0.4.1 regression: dry_run previews must work WITHOUT confirm=true.

.DESCRIPTION
    Verifies that all write/delete/order tools return dry_run previews
    without requiring confirm=true or danger_confirm.
    This is the key safety guarantee: dry_run is always safe.

    Fails if any tool returns an error about confirm being required
    when dry_run=true (or default true).

.PARAMETER BaseUrl
    The base URL of the deployed application.

.PARAMETER McpAccessToken
    MCP access token for authentication.

.EXAMPLE
    .\scripts\smoke-dryrun-no-confirm.ps1 -BaseUrl "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru" -McpAccessToken "your-token"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,

    [Parameter(Mandatory=$false)]
    [string]$McpAccessToken
)

$results = @()

function Test-Step {
    param([string]$Name, [scriptblock]$Test)
    try {
        $result = & $Test
        $results += [PSCustomObject]@{ Test = $Name; Status = "PASS"; Detail = $result }
    } catch {
        $results += [PSCustomObject]@{ Test = $Name; Status = "FAIL"; Detail = $_.Exception.Message }
    }
}

function Invoke-McpTool {
    param(
        [string]$BaseUrl,
        [string]$McpAccessToken,
        [string]$ToolName,
        [hashtable]$Arguments
    )
    $headers = @{
        "Authorization" = "Bearer $McpAccessToken"
        "x-eventicious-client-id" = "fake-client-id"
        "x-eventicious-client-secret" = "fake-client-secret"
        "Accept" = "application/json, text/event-stream"
    }
    $body = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/call"
        params = @{
            name = $ToolName
            arguments = $Arguments
        }
    } | ConvertTo-Json -Depth 10

    $resp = Invoke-WebRequest -Uri "$BaseUrl/mcp" -Method POST -ContentType "application/json" -Body $body -Headers $headers -UseBasicParsing
    $sse = $resp.Content
    $dataLine = ($sse -split "`n") | Where-Object { $_ -match "^data: " } | Select-Object -First 1
    $json = $dataLine -replace "^data: ", ""
    return ($json | ConvertFrom-Json)
}

$BaseUrl = $BaseUrl.TrimEnd('/')

Write-Host "`nv0.4.1 Dry-Run No-Confirm Regression: $BaseUrl`n" -ForegroundColor Cyan
Write-Host "ALL tests call dry_run=true WITHOUT confirm=true.`n" -ForegroundColor Yellow

# --- Catalog write tools ---

Test-Step "create_catalog dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_catalog" -Arguments @{
        name = "Regression Test Catalog"
        externalId = "regression-001"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "update_catalog dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_update_catalog" -Arguments @{
        catalogId = 9999001
        name = "Updated"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "delete_catalog dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_catalog" -Arguments @{
        catalogId = 9999001
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "create_folder dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_folder" -Arguments @{
        catalogId = 9999001
        name = "Regression Folder"
        viewOptions = "textOnly"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "update_folder dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_update_folder" -Arguments @{
        catalogId = 9999001
        folderId = 9999002
        name = "Updated"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "delete_folder dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_folder" -Arguments @{
        catalogId = 9999001
        folderId = 9999002
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "create_link dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_link" -Arguments @{
        catalogId = 9999001
        name = "Regression Link"
        url = "https://example.com"
        viewOptions = "textOnly"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "delete_link dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_link" -Arguments @{
        catalogId = 9999001
        catalogElementId = 9999003
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "create_text2 dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_text2" -Arguments @{
        catalogId = 9999001
        text = "**Regression** text"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "delete_text2 dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_text2" -Arguments @{
        catalogId = 9999001
        catalogElementId = 9999004
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "add_video_to_catalog dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_add_video_to_catalog" -Arguments @{
        catalogId = 9999001
        videoId = 9999005
        name = "Regression Video"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "delete_video_from_catalog dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_video_from_catalog" -Arguments @{
        catalogId = 9999001
        catalogElementId = 9999005
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "add_groups_to_catalog dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_add_groups_to_catalog" -Arguments @{
        catalogId = 9999001
        groups = @(@{ externalId = 1001; order = 1 })
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "delete_group_from_catalog dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_group_from_catalog" -Arguments @{
        catalogId = 9999001
        catalogElementId = 9999006
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "set_catalog_order dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_set_catalog_order" -Arguments @{
        catalogIds = @(9999001, 9999002)
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "set_catalog_element_order dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_set_catalog_element_order" -Arguments @{
        catalogId = 9999001
        orderedItems = @(@{ id = 9999003; type = "Link" })
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "bulk_delete_catalog_elements dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_bulk_delete_catalog_elements" -Arguments @{
        catalogId = 9999001
        elementIds = @(9999003)
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "add_to_menu dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_add_to_menu" -Arguments @{
        catalogId = 9999001
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "delete_from_menu dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_from_menu" -Arguments @{
        catalogId = 9999001
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

# --- Users/Groups ---

Test-Step "create_users dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_users" -Arguments @{
        users = @(@{ id = 9999101; firstName = "Test"; lastName = "User" })
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "delete_users dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_users" -Arguments @{
        userIds = @(9999101)
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

# --- Schedule ---

Test-Step "create_session dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_session" -Arguments @{
        id = 9999201
        title = "Regression Session"
        startTime = "2026-09-01T10:00"
        endTime = "2026-09-01T11:00"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "delete_session dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_session" -Arguments @{
        id = 9999201
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "add_file_to_catalog dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_add_file_to_catalog" -Arguments @{
        catalogId = 9999001
        fileId = 9999301
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "delete_file_from_catalog dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_file_from_catalog" -Arguments @{
        catalogId = 9999001
        catalogElementId = 9999301
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

# --- Print results ---

Write-Host "`nResults:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
if ($failed -gt 0) {
    Write-Host "$failed test(s) FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "All tests PASSED" -ForegroundColor Green
}
