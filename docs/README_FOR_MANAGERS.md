# Eventicious MCP Remote Connector - Manager Guide

## Quick Start

### 1. Get Eventicious API Keys

Contact your Eventicious account manager to get:
- client_id - Your project identifier
- client_secret - Your project secret key

IMPORTANT: Each project has its own client_id/client_secret.
Never use credentials from one project in another.

### 2. Configure MCP Connection

Add to your MCP client config:

{
  "mcpServers": {
    "eventicious": {
      "type": "http",
      "url": "https://your-app.run.layero.app/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_ACCESS_TOKEN",
        "x-eventicious-client-id": "YOUR_CLIENT_ID",
        "x-eventicious-client-secret": "YOUR_CLIENT_SECRET"
      }
    }
  }
}

### 3. Working with Tools

#### The Golden Rule: Always dry_run First

Every write operation defaults to dry_run=true. This means:
- You see a preview of what WOULD happen
- Nothing actually changes in Eventicious
- You can review the payload before committing

#### Step-by-Step Workflow

1. Test connection: Use eventicious_auth_check tool
2. Preview changes: Run any tool with dry_run: true (default)
3. Review the preview: Check that users/groups look correct
4. Execute: Set dry_run: false AND confirm: true

#### Why confirm=true is Required

The confirm flag is a safety mechanism. It prevents accidental execution.
Even if you set dry_run: false, the tool will refuse to run without confirm: true.

### Handling Excel/CSV Data from Clients

When a client sends user data in Excel or CSV:

1. First, parse the file into JSON format
2. Use the tool with dry_run: true to preview
3. Review the preview carefully
4. Only then execute with dry_run: false + confirm: true

Never send raw data directly to Eventicious without preview.

### Available Tools

| Tool | Description | Default |
|------|-------------|---------|
| eventicious_auth_check | Verify credentials work | Read-only |
| eventicious_create_users | Create new users | dry_run=true |
| eventicious_update_users | Update existing users | dry_run=true |
| eventicious_block_users | Block users | dry_run=true |
| eventicious_unblock_users | Unblock users | dry_run=true |
| eventicious_get_acl_groups | List all groups | Read-only |
| eventicious_create_acl_group | Create a new group | dry_run=true |
| eventicious_move_users_to_groups | Move users between groups | dry_run=true |
| eventicious_delete_users | Delete users permanently | dry_run=true |
| eventicious_update_acl_group | Rename a group | dry_run=true |
| eventicious_delete_acl_group | Delete a group permanently | dry_run=true |
| eventicious_add_user_roles | Assign Curator/Supervisor | dry_run=true |
| eventicious_remove_user_roles | Remove roles | dry_run=true |
| eventicious_add_user_mentors | Assign mentor to mentees | dry_run=true |
| eventicious_remove_user_mentors | Remove mentor from mentees | dry_run=true |
| eventicious_create_location | Create schedule location | dry_run=true |
| eventicious_update_location | Update schedule location | dry_run=true |
| eventicious_delete_location | Delete schedule location permanently | dry_run=true |
| eventicious_create_tag | Create schedule tag/topic | dry_run=true |
| eventicious_update_tag | Update schedule tag | dry_run=true |
| eventicious_delete_tag | Delete schedule tag permanently | dry_run=true |
| eventicious_create_session | Create schedule session/event | dry_run=true |
| eventicious_update_session | Update schedule session | dry_run=true |
| eventicious_delete_session | Delete schedule session permanently | dry_run=true |
| eventicious_create_session_attachment | Create session attachment/link | dry_run=true |
| eventicious_update_session_attachment | Update session attachment | dry_run=true |
| eventicious_delete_session_attachment | Delete session attachment permanently | dry_run=true |
| eventicious_prepare_schedule_import | Build import plan from Excel/JSON | helper |
| eventicious_validate_schedule_plan | Validate import plan | helper |

### Safety Limits

- Max 200 users per batch operation
- Rate limit: 10 requests/minute for user operations (when auto-publish is enabled)
- All operations are logged for audit
- Credentials are never stored on server

### Destructive Operations (v0.2)

Two tools require an extra safety string beyond confirm=true:

- **eventicious_delete_users**: Requires `danger_confirm='DELETE_EVENTICIOUS_USERS'`
- **eventicious_delete_acl_group**: Requires `danger_confirm='DELETE_EVENTICIOUS_ACL_GROUP'`

This prevents accidental permanent deletion of users or groups.

### Program Schedule Workflow (v0.3)

Import schedule from Excel/JSON:

1. **Prepare**: Use `eventicious_prepare_schedule_import` with your schedule rows
2. **Validate**: Use `eventicious_validate_schedule_plan` to check for errors
3. **Review**: Check warnings and resolved IDs
4. **Dry-run**: Use `eventicious_create_location`, `eventicious_create_tag`, `eventicious_create_session` with `dry_run: true`
5. **Approve**: Execute with `dry_run: false` + `confirm: true`

Required columns for schedule import:
- **title** — session title (required)
- **startDate + startTime** or **startsAt** — when it starts (required)
- **endDate + endTime** or **endsAt** — when it ends (required)
- **locationName** or **locationId** — where it happens
- **tagNames** or **tagIds** — topics/categories
- **speakerNames** or **speakerIds** — who presents (must exist as users)
- **aclGroupNames** or **aclGroupsIds** — visibility control (must exist as ACL groups)

Speakers must exist as Eventicious users (created via `eventicious_create_users`) or be auto-created if `createMissingSpeakersAsUsers=true` in import options.

ACL groups must exist or be created first if `createMissingAclGroups=true` in import options.

### Important Notes

- Never share your client_secret
- Credentials are passed via headers, not stored on server
- Always preview with dry_run before executing
- Each project should have its own credentials
- Contact support if you encounter errors

## First safe test

1. Check tools/list - verify all 15 tools are available
2. Run eventicious_auth_check with your project keys - should return "Credentials valid"
3. Create a dry_run preview of any write operation (e.g. create_users with dry_run: true)
4. Review the preview payload carefully
5. Only then execute a real action with dry_run: false AND confirm: true
