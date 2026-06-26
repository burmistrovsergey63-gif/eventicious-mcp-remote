<#
.SYNOPSIS
    v0.2 dry-run smoke tests for Eventicious MCP Remote Connector.

.DESCRIPTION
    Calls all new v0.2 tools via the MCP endpoint with fake Eventicious credentials
    and dry_run=true. Verifies that each tool returns the expected dry_run payload
    without making real Eventicious requests.

.PARAMETER BaseUrl
    The base URL of the deployed application.

.PARAMETER McpAccessToken
    MCP access token for authentication.

.EXAMPLE
    .\scripts\smoke-v02-dryrun.ps1 -BaseUrl "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru" -McpAccessToken "your-token"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,

    [Parameter(Mandatory=$true)]
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

    $resp = Invoke-RestMethod -Uri "$BaseUrl/mcp" -Method POST -ContentType "application/json" -Body $body -Headers $headers
    return $resp
}

$BaseUrl = $BaseUrl.TrimEnd('/')

Write-Host "`nv0.2 Dry-Run Smoke Tests: $BaseUrl`n" -ForegroundColor Cyan

# 1. Verify 15 tools total
Test-Step "tools/list => 15 tools" {
    $headers = @{
        "Authorization" = "Bearer $McpAccessToken"
        "x-eventicious-client-id" = "fake-client-id"
        "x-eventicious-client-secret" = "fake-client-secret"
    }
    $body = '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
    $resp = Invoke-RestMethod -Uri "$BaseUrl/mcp" -Method POST -ContentType "application/json" -Body $body -Headers $headers
    $toolCount = ($resp.result.tools | Measure-Object).Count
    if ($toolCount -eq 15) {
        return "$toolCount tools found"
    }
    throw "Expected 15 tools, got $toolCount"
}

# 2. eventicious_delete_users dry_run
Test-Step "eventicious_delete_users dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_users" -Arguments @{
        userIds = @(1, 2, 3)
        dry_run = $true
        confirm = $false
        danger_confirm = "DELETE_EVENTICIOUS_USERS"
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "DELETE.*users/delete") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response: $($resp | ConvertTo-Json -Compress)"
}

# 3. eventicious_delete_users without danger_confirm
Test-Step "eventicious_delete_users without danger_confirm => error" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_users" -Arguments @{
        userIds = @(1, 2, 3)
        dry_run = $true
        confirm = $false
        danger_confirm = "WRONG_STRING"
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($resp.result.isError -eq $true -and $text.error -match "danger_confirm") {
        return "error as expected: $($text.error)"
    }
    throw "Expected danger_confirm error, got: $($resp | ConvertTo-Json -Compress)"
}

# 4. eventicious_update_acl_group dry_run
Test-Step "eventicious_update_acl_group dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_update_acl_group" -Arguments @{
        id = 100
        name = "Updated Name"
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "PUT.*aclgroups/update/100") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response: $($resp | ConvertTo-Json -Compress)"
}

# 5. eventicious_delete_acl_group dry_run
Test-Step "eventicious_delete_acl_group dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_acl_group" -Arguments @{
        id = 100
        dry_run = $true
        confirm = $false
        danger_confirm = "DELETE_EVENTICIOUS_ACL_GROUP"
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "DELETE.*aclgroups/delete/100") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response: $($resp | ConvertTo-Json -Compress)"
}

# 6. eventicious_delete_acl_group without danger_confirm
Test-Step "eventicious_delete_acl_group without danger_confirm => error" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_delete_acl_group" -Arguments @{
        id = 100
        dry_run = $true
        confirm = $false
        danger_confirm = "WRONG_STRING"
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($resp.result.isError -eq $true -and $text.error -match "danger_confirm") {
        return "error as expected: $($text.error)"
    }
    throw "Expected danger_confirm error, got: $($resp | ConvertTo-Json -Compress)"
}

# 7. eventicious_add_user_roles dry_run
Test-Step "eventicious_add_user_roles dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_add_user_roles" -Arguments @{
        roleInfo = @(@{ groupId = 1; userId = 1; roleIds = @(1, 2) })
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "roles/add") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response: $($resp | ConvertTo-Json -Compress)"
}

# 8. eventicious_remove_user_roles dry_run
Test-Step "eventicious_remove_user_roles dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_remove_user_roles" -Arguments @{
        roleInfo = @(@{ groupId = 1; userId = 1; roleIds = @(1) })
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "roles/remove") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response: $($resp | ConvertTo-Json -Compress)"
}

# 9. eventicious_add_user_mentors dry_run
Test-Step "eventicious_add_user_mentors dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_add_user_mentors" -Arguments @{
        mentorId = 1
        menteeIds = @(10, 11, 12)
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "POST.*users/mentor") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response: $($resp | ConvertTo-Json -Compress)"
}

# 10. eventicious_remove_user_mentors dry_run
Test-Step "eventicious_remove_user_mentors dry_run" {
    $resp = Invoke-McpTool -BaseUrl $BaseUrl -McpAccessToken $McpAccessToken -ToolName "eventicious_remove_user_mentors" -Arguments @{
        mentorId = 1
        menteeIds = @(10, 11)
        dry_run = $true
        confirm = $false
    }
    $text = $resp.result.content[0].text | ConvertFrom-Json
    if ($text.dry_run -eq $true -and $text.endpoint -match "DELETE.*users/mentor") {
        return "dry_run=true, endpoint=$($text.endpoint)"
    }
    throw "Unexpected response: $($resp | ConvertTo-Json -Compress)"
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
