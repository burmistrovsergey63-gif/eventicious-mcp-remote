import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { config } from "../config";
import {
  extractEventiciousCredentials,
  validateEventiciousCredentials,
} from "../auth";
import { eventiciousRequest } from "../eventicious-client";
import { logger } from "../logger";
import { guardUserBatchSize, warnAutoPublishRateLimit } from "../rate-limit";

export async function handleMcpRequest(request: Request): Promise<Response> {
  logger.info("mcp_request_start", { method: request.method });

  const credentials = extractEventiciousCredentials(request);
  const validation = validateEventiciousCredentials(credentials);
  if (!validation.ok) {
    logger.warn("mcp_credentials_invalid", { error: validation.error });
    return new Response(
      JSON.stringify({ error: validation.error }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const server = new McpServer({
    name: "eventicious-mcp-remote",
    version: "0.1.0",
  });

  registerTools(server, credentials);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  return await transport.handleRequest(request);
}

function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true as const,
  };
}

function registerTools(
  server: McpServer,
  credentials: ReturnType<typeof extractEventiciousCredentials>
) {
  const maxUsers = config.maxUsersPerRequest;

  server.tool(
    "eventicious_auth_check",
    "Check that Eventicious credentials are valid and token can be obtained",
    {},
    async () => {
      logger.info("tool_call", { tool: "eventicious_auth_check" });
      try {
        await eventiciousRequest({
          method: "GET",
          endpoint: "/api/external/v2/aclgroups",
          credentials,
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
        logger.error("auth_check_failed", {
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_create_users",
    "Create users in Eventicious. dry_run=true by default. Max 200 users per request.",
    {
      users: z
        .array(
          z.object({
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
          })
        )
        .min(1)
        .max(maxUsers),
      dry_run: z
        .boolean()
        .default(true)
        .describe("Preview only, do not execute"),
      confirm: z
        .boolean()
        .default(false)
        .describe("Must be true to execute when dry_run=false"),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_create_users",
        dry_run: params.dry_run,
        user_count: params.users.length,
      });

      guardUserBatchSize(params.users);

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required for real execution");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/users/create",
                payload: { users: params.users },
              }),
            },
          ],
        };
      }

      warnAutoPublishRateLimit("eventicious_create_users");

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/users/create",
          body: { users: params.users },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_create_users",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_update_users",
    "Update existing users in Eventicious. dry_run=true by default. Max 200 users per request.",
    {
      users: z
        .array(
          z.object({
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
          })
        )
        .min(1)
        .max(maxUsers),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_update_users",
        dry_run: params.dry_run,
        user_count: params.users.length,
      });

      guardUserBatchSize(params.users);

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "PATCH /api/external/v2/users/update",
                payload: { users: params.users },
              }),
            },
          ],
        };
      }

      warnAutoPublishRateLimit("eventicious_update_users");

      try {
        const res = await eventiciousRequest({
          method: "PATCH",
          endpoint: "/api/external/v2/users/update",
          body: { users: params.users },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_update_users",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_block_users",
    "Block users in Eventicious. dry_run=true by default. Max 200 users.",
    {
      userIds: z.array(z.number()).min(1).max(maxUsers),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_block_users",
        dry_run: params.dry_run,
        user_count: params.userIds.length,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/users/block",
                payload: { userIds: params.userIds },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/users/block",
          body: { userIds: params.userIds },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_block_users",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_unblock_users",
    "Unblock users in Eventicious. dry_run=true by default. Max 200 users.",
    {
      userIds: z.array(z.number()).min(1).max(maxUsers),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_unblock_users",
        dry_run: params.dry_run,
        user_count: params.userIds.length,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/users/unblock",
                payload: { userIds: params.userIds },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/users/unblock",
          body: { userIds: params.userIds },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_unblock_users",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_get_acl_groups",
    "Get list of all non-system ACL groups from Eventicious. Read-only.",
    {},
    async () => {
      logger.info("tool_call", { tool: "eventicious_get_acl_groups" });
      try {
        const res = await eventiciousRequest({
          method: "GET",
          endpoint: "/api/external/v2/aclgroups",
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_get_acl_groups",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
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
      logger.info("tool_call", {
        tool: "eventicious_create_acl_group",
        dry_run: params.dry_run,
        group_id: params.id,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/aclgroups/create",
                payload: { id: params.id, name: params.name },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/aclgroups/create",
          body: { id: params.id, name: params.name },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_create_acl_group",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
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
      logger.info("tool_call", {
        tool: "eventicious_move_users_to_groups",
        dry_run: params.dry_run,
        user_count: params.userIds.length,
      });

      if (!params.dry_run && !params.confirm) {
        return toolError("confirm=true required");
      }

      const payload = {
        userIds: params.userIds,
        groupIdsAddTo: params.groupIdsAddTo,
        groupIdsRemoveFrom: params.groupIdsRemoveFrom,
      };

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "POST /api/external/v2/aclgroups/users/move",
                payload,
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/aclgroups/users/move",
          body: payload,
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_move_users_to_groups",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );
}
