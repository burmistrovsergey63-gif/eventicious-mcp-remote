<#
.SYNOPSIS
    v0.5 dry-run smoke tests for Eventicious MCP Remote Connector.

.DESCRIPTION
    Tests all v0.5 course/gamification tools via the MCP endpoint with dry_run=true.
    Does NOT require confirm=true for dry_run previews.
    Does NOT make real Eventicious requests.

.PARAMETER BaseUrl
    The base URL of the deployed application.

.PARAMETER McpAccessToken
    MCP access token for authentication.

.EXAMPLE
    .\scripts\smoke-v05-dryrun.ps1 -BaseUrl "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru" -McpAccessToken "your-token"
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

Write-Host "`nv0.5 Dry-Run Smoke Tests: $BaseUrl`n" -ForegroundColor Cyan
Write-Host "ALL tests call dry_run=true WITHOUT confirm=true.`n" -ForegroundColor Yellow

# --- Helper tools ---

Test-Step "prepare_course_import helper" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_prepare_course_import" -Arguments @{
        name = "Test Course"
        description = "Test course description"
        coverImageFileId = 12345
        coverImageThumbnailFileId = 12346
        stages = @(
            @{ name = "Info Stage"; type = "Common" }
            @{ name = "Quiz Stage"; type = "Common"; settings = @{ transition = @{ conditionType = "PassPoll"; poll = @{ name = "Quiz 1" } } } }
            @{ name = "Task Stage"; type = "Task"; taskContent = @{ title = "Assignment 1" } }
            @{ name = "SCORM Stage"; type = "Scorm" }
        )
        settings = @{ progress = @{ isEnabled = $true; hintText = "Progress" }; finalScreen = @{ isEnabled = $true; title = "Done!" }; deadline = @{ isEnabled = $false } }
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.recommendedExecutionOrder -and $text.stageContentPlan) {
        return "OK, stages=$($text.stageContentPlan.Count), order=$($text.recommendedExecutionOrder.Count) steps"
    }
    throw "Unexpected response"
}

Test-Step "validate_course_plan helper" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_validate_course_plan" -Arguments @{
        coursePlan = @{
            name = "Test Course"
            coverImageFileId = 12345
            coverImageThumbnailFileId = 12346
            stages = @(
                @{ name = "Info Stage"; type = "Common" }
            )
            settings = @{ progress = @{ isEnabled = $true; hintText = "Progress" }; finalScreen = @{ isEnabled = $true; title = "Done!" }; deadline = @{ isEnabled = $false } }
        }
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($null -ne $text.valid -and $text.summary) {
        return "valid=$($text.valid), stages=$($text.summary.stagesCount)"
    }
    throw "Unexpected response"
}

Test-Step "map_course_import_response helper" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_map_course_import_response" -Arguments @{
        importResponse = @{
            id = 100
            name = "Test Course"
            courseCatalog = @{ id = 200; name = "Test Catalog" }
            stages = @(
                @{ id = 300; name = "Info"; type = "Common"; catalog = @{ id = 400 } }
                @{ id = 301; name = "Quiz"; type = "Common"; catalog = @{ id = 401 }; poll = @{ id = 500; name = "Quiz 1" } }
                @{ id = 302; name = "Task"; type = "Task"; catalog = @{ id = 402 }; taskContent = @{ id = 600; title = "Assignment" } }
                @{ id = 303; name = "SCORM"; type = "Scorm"; catalog = @{ id = 403 }; scormId = 700 }
            )
        }
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.courseId -eq 100 -and $text.stages.Count -eq 4) {
        return "courseId=100, stages=4, courseCatalogId=200"
    }
    throw "Unexpected response"
}

Test-Step "check_course_ready_to_finalize helper" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_check_course_ready_to_finalize" -Arguments @{
        courseId = 100
        coursePlan = @{ name = "Test"; stages = @() }
        filledContentStatus = @{
            catalogsFilled = $true
            pollsFilled = $true
            tasksFilled = $true
            scormUploaded = $true
            coverUploaded = $true
            attachmentsUploaded = $true
        }
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($null -ne $text.ready -and $text.finalizePreview) {
        return "ready=$($text.ready), blockers=$($text.blockers.Count)"
    }
    throw "Unexpected response"
}

# --- Course tools ---

Test-Step "import_course_structure dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_import_course_structure" -Arguments @{
        name = "Smoke Course"
        coverImageFileId = 12345
        coverImageThumbnailFileId = 12346
        settings = @{ progress = @{ isEnabled = $true; hintText = "Progress" }; finalScreen = @{ isEnabled = $true; title = "Done!" }; deadline = @{ isEnabled = $false } }
        stages = @(@{ name = "Info"; type = "Common" })
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "finalize_course dry_run (no confirm, no danger_confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_finalize_course" -Arguments @{
        courseId = 999
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "upload_course_images dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_upload_course_images" -Arguments @{
        filePaths = @("/path/to/image.jpg")
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

# --- Poll tools ---

Test-Step "import_poll_content dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_import_poll_content" -Arguments @{
        pollId = 999
        name = "Test Quiz"
        type = "Common"
        screens = @(
            @{
                title = "Screen 1"
                questions = @(
                    @{ text = "Q1?"; type = "SingleSelect"; options = @(@{ optionData = @{ text = "A" }; isRight = $true }) }
                )
            }
        )
        resultScreenSettings = @{}
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

# --- Task content tools ---

Test-Step "import_task_content dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_import_task_content" -Arguments @{
        taskContentId = 999
        title = "Assignment 1"
        description = "Submit your work"
        settings = @{}
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

Test-Step "upload_task_attachments dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_upload_task_attachments" -Arguments @{
        filePaths = @("/path/to/file.pdf")
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

# --- SCORM tools ---

Test-Step "upload_scorm_to_stage dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_upload_scorm_to_stage" -Arguments @{
        courseId = 100
        stageId = 300
        scormId = 700
        filePath = "/path/to/scorm.zip"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true) { return "OK" }
    throw "Expected dry_run=true"
}

# --- Gamification tools ---

Test-Step "add_manual_gamification_charge dry_run (no confirm)" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_add_manual_gamification_charge" -Arguments @{
        externalId = 456
        scores = 100
        reason = "Completion bonus"
        dry_run = $true
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.preview.scores -eq 100) { return "OK, scores=100" }
    throw "Expected dry_run=true with scores"
}

# --- Total tools check ---

Test-Step "tools/count == 68 and all v0.5 tools present" {
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
    $toolNames = $parsed.result.tools | ForEach-Object { $_.name } | Sort-Object
    $toolCount = ($toolNames | Measure-Object).Count
    Write-Host "  Tools count: $toolCount"

    if ($toolCount -ne 68) {
        throw "Expected exactly 68 tools, got $toolCount"
    }

    $v05Tools = @(
        "eventicious_prepare_course_import",
        "eventicious_validate_course_plan",
        "eventicious_map_course_import_response",
        "eventicious_check_course_ready_to_finalize",
        "eventicious_upload_course_images",
        "eventicious_import_course_structure",
        "eventicious_import_poll_content",
        "eventicious_import_task_content",
        "eventicious_upload_task_attachments",
        "eventicious_upload_scorm_to_stage",
        "eventicious_finalize_course",
        "eventicious_add_manual_gamification_charge"
    )

    $missing = @()
    foreach ($t in $v05Tools) {
        if ($toolNames -notcontains $t) {
            $missing += $t
        }
    }

    if ($missing.Count -gt 0) {
        throw "Missing v0.5 tools: $($missing -join ', ')"
    }

    return "$toolCount tools, all 12 v0.5 tools present"
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
