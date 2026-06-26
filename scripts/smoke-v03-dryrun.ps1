<#
.SYNOPSIS
    v0.3 dry-run smoke tests for Eventicious MCP Remote Connector.

.DESCRIPTION
    Tests all v0.3 schedule tools via the MCP endpoint with dry_run=true.
    Does NOT make real Eventicious requests.

.PARAMETER BaseUrl
    The base URL of the deployed application.

.PARAMETER McpAccessToken
    MCP access token for authentication.

.EXAMPLE
    .\scripts\smoke-v03-dryrun.ps1 -BaseUrl "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru" -McpAccessToken "your-token"
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

Write-Host "`nv0.3 Dry-Run Smoke Tests: $BaseUrl`n" -ForegroundColor Cyan

# 1. Verify 22 tools total (15 existing + 12 new = 27... let me count)
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
    if ($toolCount -ge 22) {
        return "$toolCount tools found"
    }
    throw "Expected >= 22 tools, got $toolCount"
}

# 2. Locations create dry_run
Test-Step "eventicious_create_location dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_location" -Arguments @{
        id = 9999001
        name = "Smoke Test Location"
        position = 1
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "locations/create") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 3. Locations update dry_run
Test-Step "eventicious_update_location dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_update_location" -Arguments @{
        id = 9999001
        name = "Updated Location"
        position = 2
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "locations/update") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 4. Locations delete dry_run
Test-Step "eventicious_delete_location dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_location" -Arguments @{
        id = 9999001
        dry_run = $true
        confirm = $false
        danger_confirm = "DELETE_EVENTICIOUS_LOCATIONS"
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "locations/delete") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 5. Tags create dry_run
Test-Step "eventicious_create_tag dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_tag" -Arguments @{
        id = 9999002
        name = "Smoke Tag"
        color = "#FF0000"
        visibilityFlag = 1
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "tags/create") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 6. Tags update dry_run
Test-Step "eventicious_update_tag dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_update_tag" -Arguments @{
        id = 9999002
        name = "Updated Tag"
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "tags/update") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 7. Tags delete dry_run
Test-Step "eventicious_delete_tag dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_tag" -Arguments @{
        id = 9999002
        dry_run = $true
        confirm = $false
        danger_confirm = "DELETE_EVENTICIOUS_TAGS"
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "tags/delete") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 8. Sessions create dry_run
Test-Step "eventicious_create_session dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_session" -Arguments @{
        id = 9999003
        title = "Smoke Session"
        startTime = "2026-09-01T10:00"
        endTime = "2026-09-01T11:00"
        locationsIds = @(1001)
        tagIds = @(2001)
        speakersIds = @(101)
        aclGroupsIds = @(5001)
        type = 0
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "sessions/create") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 9. Sessions update dry_run
Test-Step "eventicious_update_session dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_update_session" -Arguments @{
        id = 9999003
        title = "Updated Session"
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "sessions/update") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 10. Sessions delete dry_run
Test-Step "eventicious_delete_session dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_session" -Arguments @{
        id = 9999003
        dry_run = $true
        confirm = $false
        danger_confirm = "DELETE_EVENTICIOUS_SESSIONS"
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "sessions/delete") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 11. Session attachments create dry_run
Test-Step "eventicious_create_session_attachment dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_create_session_attachment" -Arguments @{
        sessionId = 9999003
        id = 9999004
        title = "Smoke Attachment"
        url = "https://example.com/test.pdf"
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "attachments/create") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 12. Session attachments update dry_run
Test-Step "eventicious_update_session_attachment dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_update_session_attachment" -Arguments @{
        sessionId = 9999003
        attachmentId = 9999004
        title = "Updated Attachment"
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "attachments/update") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 13. Session attachments delete dry_run
Test-Step "eventicious_delete_session_attachment dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_session_attachment" -Arguments @{
        sessionId = 9999003
        attachmentId = 9999004
        dry_run = $true
        confirm = $false
        danger_confirm = "DELETE_EVENTICIOUS_SESSION_ATTACHMENTS"
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "attachments/delete") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response"
}

# 14. Schedule import prepare helper
Test-Step "eventicious_prepare_schedule_import helper" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_prepare_schedule_import" -Arguments @{
        rows = @(
            @{
                title = "Test Session"
                startDate = "2026-09-01"
                startTime = "10:00"
                endDate = "2026-09-01"
                endTime = "11:00"
                locationName = "Test Location"
                tagNames = @("TestTag")
                speakerNames = @("Test Speaker")
                speakerEmails = @("test@example.com")
                aclGroupNames = @("TestGroup")
            }
        )
        options = @{
            createMissingLocations = $true
            createMissingTags = $true
            createMissingAclGroups = $true
            createMissingSpeakersAsUsers = $true
        }
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.sessionsToCreate -and $text.locationsToCreate -and $text.recommendedExecutionOrder) {
        return "helper OK, sessions=$($text.sessionsToCreate.Count), locations=$($text.locationsToCreate.Count)"
    }
    throw "Unexpected response"
}

# 15. Schedule import validate helper
Test-Step "eventicious_validate_schedule_plan helper" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_validate_schedule_plan" -Arguments @{
        plan = @{
            normalizedRows = @(
                @{
                    title = "Test Session"
                    startTime = "2026-09-01T10:00"
                    endTime = "2026-09-01T11:00"
                    externalId = "ext-001"
                }
            )
            locationsToCreate = @()
            tagsToCreate = @()
            speakersToResolve = @()
            speakersToCreateAsUsers = @()
            aclGroupsToResolve = @()
            aclGroupsToCreate = @()
            sessionsToCreate = @(
                @{ id = 1; title = "Test Session"; startTime = "2026-09-01T10:00"; endTime = "2026-09-01T11:00" }
            )
            attachmentsToCreate = @()
            warnings = @()
            errors = @()
        }
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($null -ne $text.valid -and $text.summary) {
        return "validator OK, valid=$($text.valid), sessions=$($text.summary.totalSessions)"
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
