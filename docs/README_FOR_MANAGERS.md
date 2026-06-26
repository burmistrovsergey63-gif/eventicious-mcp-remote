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

### Safety Limits

- Max 200 users per batch operation
- Rate limit: 10 requests/minute for user operations (when auto-publish is enabled)
- All operations are logged for audit
- Credentials are never stored on server

### Important Notes

- Never share your client_secret
- Credentials are passed via headers, not stored on server
- Always preview with dry_run before executing
- Each project should have its own credentials
- Contact support if you encounter errors
