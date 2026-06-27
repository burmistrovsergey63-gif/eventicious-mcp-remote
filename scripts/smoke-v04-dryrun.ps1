<#
.SYNOPSIS
    v0.4.1 dry-run smoke tests for Eventicious MCP Remote Connector.

.DESCRIPTION
    Tests all v0.4 catalog tools via the MCP endpoint with dry_run=true.
    Does NOT require confirm=true for dry_run previews.
    Does NOT make real Eventicious requests.

.PARAMETER BaseUrl
    The base URL of the deployed application.

.PARAMETER McpAccessToken
    MCP access token for authentication.

.EXAMPLE
    .\scripts\smoke-v04-dryrun.ps1 -BaseUrl "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru" -McpAccessToken "your-token"
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

Write-Host "`nv0.4.1 Dry-Run Smoke Tests: $BaseUrl`n" -ForegroundColor Cyan

# 1. Verify tool count >= 56
Test-Step "tools/list => expected tools" {
    $headers = @{
        "Authorization" = "Bearer $McpAccessToken"
        "x-eventicious-client-id" = "fake-client-id"
        "x-eventicious-client-secret" = "fake-client-secret"
        "Accept" = "application/json, text/event-stream"
    }
    $body = '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
    $resp = Invoke-WebRequest -Uri "$BaseUrl/mcp" -Method POST -ContentType "application/json" -Body $body -Headers $headers -UseBasicParsing
    $sse = $resp.Content
    $dataLine = ($sse -split "`n") | Where-Object { $_ -match "^data: " } | Select-Object -First 1
    $json = $dataLine -replace "^data: ", ""
    $parsed = $json | ConvertFrom-Json
    $toolCount = ($parsed.result.tools | Measure-Object).Count
    $toolNames = $parsed.result.tools | ForEach-Object { $_.name }
    Write-Host "  Tools count: $toolCount"
    Write-Host "  Tools: $($toolNames -join ', ')"
    if ($toolCount -ge 56) {
        return "$toolCount tools found"
    }
    throw "Expected >= 56 tools, got $toolCount"
}

# 2. Catalog create dry_run
Test-Step "eventicious_create_catalog dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_catalog" -Arguments @{
        name = "Smoke Test Catalog"
        externalId = "smoke-catalog-001"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, name=$($text.preview.name)"
    }
    throw "Unexpected response"
}

# 3. Catalog update dry_run
Test-Step "eventicious_update_catalog dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_update_catalog" -Arguments @{
        catalogId = 9999001
        name = "Updated Catalog"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, catalogId=$($text.catalogId)"
    }
    throw "Unexpected response"
}

# 4. Catalog delete dry_run
Test-Step "eventicious_delete_catalog dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_catalog" -Arguments @{
        catalogId = 9999001
        danger_confirm = "DELETE_EVENTICIOUS_CATALOG"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, catalogId=$($text.catalogId)"
    }
    throw "Unexpected response"
}

# 5. Folder create dry_run with aclGroupsExternalIds
Test-Step "eventicious_create_folder dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_folder" -Arguments @{
        catalogId = 9999001
        name = "Smoke Folder"
        description = "Test folder"
        viewOptions = "textOnly"
        aclGroupsExternalIds = @(1001, 1002)
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, name=$($text.preview.name)"
    }
    throw "Unexpected response"
}

# 6. Folder update dry_run
Test-Step "eventicious_update_folder dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_update_folder" -Arguments @{
        catalogId = 9999001
        folderId = 9999002
        name = "Updated Folder"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, folderId=$($text.folderId)"
    }
    throw "Unexpected response"
}

# 7. Folder delete dry_run
Test-Step "eventicious_delete_folder dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_folder" -Arguments @{
        catalogId = 9999001
        folderId = 9999002
        danger_confirm = "DELETE_EVENTICIOUS_CATALOG_FOLDER"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, folderId=$($text.folderId)"
    }
    throw "Unexpected response"
}

# 8. Link create dry_run
Test-Step "eventicious_create_link dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_link" -Arguments @{
        catalogId = 9999001
        name = "Test Link"
        url = "https://example.com"
        viewOptions = "textOnly"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, name=$($text.preview.name)"
    }
    throw "Unexpected response"
}

# 9. Link delete dry_run
Test-Step "eventicious_delete_link dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_link" -Arguments @{
        catalogId = 9999001
        catalogElementId = 9999003
        danger_confirm = "DELETE_EVENTICIOUS_CATALOG_CONTENT"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, catalogElementId=$($text.catalogElementId)"
    }
    throw "Unexpected response"
}

# 10. Markdown to GravityJson helper
Test-Step "eventicious_convert_markdown_to_gravity_json helper" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_convert_markdown_to_gravity_json" -Arguments @{
        text = "# Hello World`n`nThis is **bold** and *italic*.`n`n- Item 1`n- Item 2"
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.gravityJson.type -eq "doc" -and $text.gravityJson.content) {
        return "helper OK, type=$($text.gravityJson.type), contentCount=$($text.gravityJson.content.Count)"
    }
    throw "Unexpected response"
}

# 11. Text 2.0 create dry_run with GravityJson object
Test-Step "eventicious_create_text2 dry_run" {
    $gravityJson = @{
        type = "doc"
        content = @(
            @{
                type = "heading"
                attrs = @{ level = 1; id = ""; dataLine = $null }
                content = @(@{ type = "text"; text = "Welcome" })
            }
            @{
                type = "paragraph"
                attrs = @{ dataLine = $null }
                content = @(@{ type = "text"; text = "Test content" })
            }
        )
    }
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_text2" -Arguments @{
        catalogId = 9999001
        text = $gravityJson
        externalId = "smoke-text2-001"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, catalogId=$($text.catalogId)"
    }
    throw "Unexpected response"
}

# 12. Text 2.0 create dry_run with markdown string
Test-Step "eventicious_create_text2 dry_run (markdown)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_text2" -Arguments @{
        catalogId = 9999001
        text = "# Hello`n`nThis is a **test**."
        externalId = "smoke-text2-002"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.gravityJsonPreview) {
        return "dry_run=true, type=$($text.gravityJsonPreview.type)"
    }
    throw "Unexpected response"
}

# 13. Text 2.0 delete dry_run
Test-Step "eventicious_delete_text2 dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_text2" -Arguments @{
        catalogId = 9999001
        catalogElementId = 9999004
        danger_confirm = "DELETE_EVENTICIOUS_CATALOG_CONTENT"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, catalogElementId=$($text.catalogElementId)"
    }
    throw "Unexpected response"
}

# 14. Video add dry_run
Test-Step "eventicious_add_video_to_catalog dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_add_video_to_catalog" -Arguments @{
        catalogId = 9999001
        videoId = 9999005
        name = "Test Video"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, videoId=$($text.preview.videoId)"
    }
    throw "Unexpected response"
}

# 15. Video delete dry_run
Test-Step "eventicious_delete_video_from_catalog dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_video_from_catalog" -Arguments @{
        catalogId = 9999001
        catalogElementId = 9999005
        danger_confirm = "DELETE_EVENTICIOUS_CATALOG_CONTENT"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, catalogElementId=$($text.catalogElementId)"
    }
    throw "Unexpected response"
}

# 16. Groups add dry_run
Test-Step "eventicious_add_groups_to_catalog dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_add_groups_to_catalog" -Arguments @{
        catalogId = 9999001
        groups = @(@{ externalId = 1001; order = 1 })
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, groups=$($text.preview.groups.Count)"
    }
    throw "Unexpected response"
}

# 17. Groups delete dry_run
Test-Step "eventicious_delete_group_from_catalog dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_group_from_catalog" -Arguments @{
        catalogId = 9999001
        catalogElementId = 9999006
        danger_confirm = "DELETE_EVENTICIOUS_CATALOG_GROUP"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, catalogElementId=$($text.catalogElementId)"
    }
    throw "Unexpected response"
}

# 18. Catalog order dry_run
Test-Step "eventicious_set_catalog_order dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_set_catalog_order" -Arguments @{
        catalogIds = @(9999001, 9999002, 9999003)
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, catalogIds=$($text.preview.catalogIds.Count)"
    }
    throw "Unexpected response"
}

# 19. Element order dry_run
Test-Step "eventicious_set_catalog_element_order dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_set_catalog_element_order" -Arguments @{
        catalogId = 9999001
        orderedItems = @(
            @{ id = 9999003; type = "Link" }
            @{ id = 9999004; type = "GravityEditorContent" }
        )
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, items=$($text.preview.orderedItems.Count)"
    }
    throw "Unexpected response"
}

# 20. Bulk delete dry_run
Test-Step "eventicious_bulk_delete_catalog_elements dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_bulk_delete_catalog_elements" -Arguments @{
        catalogId = 9999001
        elementIds = @(9999003, 9999004)
        danger_confirm = "DELETE_EVENTICIOUS_CATALOG_ITEMS_BULK"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, elementIds=$($text.preview.elementIds.Count)"
    }
    throw "Unexpected response"
}

# 21. Menu add dry_run
Test-Step "eventicious_add_to_menu dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_add_to_menu" -Arguments @{
        catalogId = 9999001
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, catalogId=$($text.catalogId)"
    }
    throw "Unexpected response"
}

# 22. Menu delete dry_run
Test-Step "eventicious_delete_from_menu dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_from_menu" -Arguments @{
        catalogId = 9999001
        danger_confirm = "CHANGE_EVENTICIOUS_CATALOG_ORDER"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) {
        return "dry_run=true, catalogId=$($text.catalogId)"
    }
    throw "Unexpected response"
}

# 23. Catalog import prepare helper
Test-Step "eventicious_prepare_catalog_import helper" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_prepare_catalog_import" -Arguments @{
        catalog = @{
            name = "Test Catalog"
            externalId = "test-cat-001"
        }
        folders = @(
            @{ name = "Day 1"; externalId = "day-1" }
        )
        links = @(
            @{ name = "Website"; url = "https://example.com"; viewOptions = "textOnly" }
        )
        text2 = @(
            @{ title = "Welcome"; markdown = "# Welcome`n`nHello!" }
        )
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.catalogsToCreate -and $text.recommendedExecutionOrder) {
        return "helper OK, catalogs=$($text.catalogsToCreate.Count), folders=$($text.foldersToCreate.Count), links=$($text.linksToCreate.Count), text2=$($text.text2ToCreate.Count)"
    }
    throw "Unexpected response"
}

# 24. Catalog import validate helper
Test-Step "eventicious_validate_catalog_plan helper" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_validate_catalog_plan" -Arguments @{
        plan = @{
            catalogsToCreate = @(
                @{ name = "Test Catalog"; externalId = "test-cat-001" }
            )
            foldersToCreate = @()
            filesToCreate = @()
            linksToCreate = @()
            text2ToCreate = @()
            videosToCreate = @()
            orderPlan = @()
        }
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($null -ne $text.valid -and $text.summary) {
        return "validator OK, valid=$($text.valid), catalogs=$($text.summary.catalogsCount)"
    }
    throw "Unexpected response"
}

# Print results
Write-Host "`nResults:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
if ($failed -gt 0) {
    Write-Host "$failed test(s) FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "All tests PASSED" -ForegroundColor Green
}
