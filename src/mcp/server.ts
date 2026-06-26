import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config";
import { extractEventiciousCredentials } from "../auth";
import { eventiciousRequest } from "../eventicious-client";
import { AuthError, EventiciousError } from "../errors";

type ToolContext = {
  request: Request;
  credentials: ReturnType<typeof extractEventiciousCredentials>;
};

function createServer(ctx: ToolContext) {
  const server = new McpServer({
    name: "eventicious-mcp-remote",
    version: "0.1.0",
  });

  server.tool(
    "eventicious_auth_check",
    "Check that Eventicious credentials are valid and token can be obtained",
    {},
    async () => {
      try {
        await eventiciousRequest({
          method: "GET",
          endpoint: "/api/external/v2/aclgroups",
          credentials: ctx.credentials,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: true, message: "Credentials valid" }),
            },
          ],
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: false, error: msg }),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "eventicious_create_users",
    "Create users in Eventicious. dry_run=true by default. Max 200 users per request.",
    {
      users: z.array(z.object({
        id: z.number().describe("External system user ID"),
        firstName: z.string().describe("First name"),
        lastName: z.string().describe("Last name"),
        email: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        division: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        region: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
        externalImagePath: z.string().optional(),
        aclGroupIds: z.array(z.number()).optional(),
      })).min(1).max(config.maxUsersPerRequest),
      dry_run: z.boolean().default(true).describe("Preview only, do not execute"),
      confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
    },
    async (params) => {
      if (!params.dry_run && !params.confirm) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required for real execution" }) }],
          isError: true,
        };
      }
      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/users/create", payload: { users: params.users } }),
          }],
        };
      }
      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/users/create",
          body: { users: params.users },
          credentials: ctx.credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
      }
    }
  );

  server.tool(
    "eventicious_update_users",
    "Update existing users in Eventicious. dry_run=true by default. Max 200 users per request.",
    {
      users: z.array(z.object({
        id: z.number().describe("External system user ID"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        division: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        region: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
        externalImagePath: z.string().optional(),
        aclGroupIds: z.array(z.number()).optional(),
      })).min(1).max(config.maxUsersPerRequest),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
      }
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "PATCH /api/external/v2/users/update", payload: { users: params.users } }) }] };
      }
      try {
        const res = await eventiciousRequest({ method: "PATCH", endpoint: "/api/external/v2/users/update", body: { users: params.users }, credentials: ctx.credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
      }
    }
  );

  server.tool(
    "eventicious_block_users",
    "Block users in Eventicious. dry_run=true by default. Max 200 users.",
    {
      userIds: z.array(z.number()).min(1).max(config.maxUsersPerRequest),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
      }
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/users/block", payload: { userIds: params.userIds } }) }] };
      }
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/users/block", body: { userIds: params.userIds }, credentials: ctx.credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
      }
    }
  );

  server.tool(
    "eventicious_unblock_users",
    "Unblock users in Eventicious. dry_run=true by default. Max 200 users.",
    {
      userIds: z.array(z.number()).min(1).max(config.maxUsersPerRequest),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
      }
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/users/unblock", payload: { userIds: params.userIds } }) }] };
      }
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/users/unblock", body: { userIds: params.userIds }, credentials: ctx.credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
      }
    }
  );

  server.tool(
    "eventicious_get_acl_groups",
    "Get list of all non-system ACL groups from Eventicious. Read-only.",
    {},
    async () => {
      try {
        const res = await eventiciousRequest({ method: "GET", endpoint: "/api/external/v2/aclgroups", credentials: ctx.credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
      }
    }
  );

  server.tool(
    "eventicious_create_acl_group",
    "Create an ACL group in Eventicious. dry_run=true by default.",
    {
      id: z.number().describe("Group ID in your external system"),
      name: z.string().describe("Group name"),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
      }
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/aclgroups/create", payload: { id: params.id, name: params.name } }) }] };
      }
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/aclgroups/create", body: { id: params.id, name: params.name }, credentials: ctx.credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
      }
    }
  );

  server.tool(
    "eventicious_move_users_to_groups",
    "Move users between ACL groups. All three arrays are required even if empty. dry_run=true by default.",
    {
      userIds: z.array(z.number()).min(1),
      groupIdsAddTo: z.array(z.number()),
      groupIdsRemoveFrom: z.array(z.number()),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
      }
      const payload = { userIds: params.userIds, groupIdsAddTo: params.groupIdsAddTo, groupIdsRemoveFrom: params.groupIdsRemoveFrom };
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/aclgroups/users/move", payload }) }] };
      }
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/aclgroups/users/move", body: payload, credentials: ctx.credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
      }
    }
  );

  return server;
}

export { createServer };

