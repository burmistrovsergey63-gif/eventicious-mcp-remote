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
import { requireDangerConfirm } from "../utils/confirm";
import {
  createUserShape,
  updateUserShape,
  blockUsersShape,
  unblockUsersShape,
  deleteUsersShape,
  addMentorsShape,
  removeMentorsShape,
} from "../schemas/users";
import {
  createAclGroupShape,
  updateAclGroupShape,
  deleteAclGroupShape,
  moveUsersShape,
  addRolesShape,
  removeRolesShape,
} from "../schemas/groups";
import { registerLocationTools } from "../tools/locations";
import { registerTagTools } from "../tools/tags";
import { registerSessionTools } from "../tools/sessions";
import { registerSessionAttachmentTools } from "../tools/session-attachments";
import { registerScheduleImportTools } from "../tools/schedule-import";
import { registerCatalogTools } from "../tools/catalogs";
import { registerCatalogElementTools } from "../tools/catalog-elements";
import { registerGravityJsonTools } from "../tools/gravity-json";
import { registerCatalogImportTools } from "../tools/catalog-import";
import { registerCourseTools } from "../tools/courses";
import { registerPollTools } from "../tools/polls";
import { registerTaskContentTools } from "../tools/task-contents";
import { registerScormTools } from "../tools/scorm";
import { registerGamificationTools } from "../tools/gamification";
import { registerCourseImportTools } from "../tools/course-import";
import { registerExpoTools } from "../tools/expo";

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
    version: "0.6.2",
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
      ...createUserShape,
      users: createUserShape.users.max(maxUsers),
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
      ...updateUserShape,
      users: updateUserShape.users.max(maxUsers),
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
      ...blockUsersShape,
      userIds: blockUsersShape.userIds.max(maxUsers),
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
      ...unblockUsersShape,
      userIds: unblockUsersShape.userIds.max(maxUsers),
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
    createAclGroupShape,
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
      ...moveUsersShape,
      userIds: moveUsersShape.userIds.max(maxUsers),
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

  // ── v0.2 tools ──────────────────────────────────────────────

  server.tool(
    "eventicious_delete_users",
    "Permanently delete users from Eventicious. Requires danger_confirm='DELETE_EVENTICIOUS_USERS' and confirm=true. dry_run=true by default.",
    {
      ...deleteUsersShape,
      userIds: deleteUsersShape.userIds.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_delete_users",
        dry_run: params.dry_run,
        user_count: params.userIds.length,
      });

      if (!params.dry_run) {
        if (!params.confirm) {
          return toolError("confirm=true required for real deletion");
        }
        if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_USERS")) {
          return toolError("danger_confirm='DELETE_EVENTICIOUS_USERS' required");
        }
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: "DELETE /api/external/v2/users/delete",
                payload: { userIds: params.userIds },
              }),
            },
          ],
        };
      }

      warnAutoPublishRateLimit("eventicious_delete_users");

      try {
        const res = await eventiciousRequest({
          method: "DELETE",
          endpoint: "/api/external/v2/users/delete",
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
          tool: "eventicious_delete_users",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_update_acl_group",
    "Rename an ACL group in Eventicious. dry_run=true by default.",
    updateAclGroupShape,
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_update_acl_group",
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
                endpoint: `PUT /api/external/v2/aclgroups/update/${params.id}`,
                payload: { name: params.name },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "PUT",
          endpoint: `/api/external/v2/aclgroups/update/${params.id}`,
          body: { name: params.name },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_update_acl_group",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_delete_acl_group",
    "Permanently delete an ACL group from Eventicious. Requires danger_confirm='DELETE_EVENTICIOUS_ACL_GROUP' and confirm=true. dry_run=true by default.",
    deleteAclGroupShape,
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_delete_acl_group",
        dry_run: params.dry_run,
        group_id: params.id,
      });

      if (!params.dry_run) {
        if (!params.confirm) {
          return toolError("confirm=true required for real deletion");
        }
        if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_ACL_GROUP")) {
          return toolError("danger_confirm='DELETE_EVENTICIOUS_ACL_GROUP' required");
        }
      }

      if (params.dry_run) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                dry_run: true,
                endpoint: `DELETE /api/external/v2/aclgroups/delete/${params.id}`,
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "DELETE",
          endpoint: `/api/external/v2/aclgroups/delete/${params.id}`,
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_delete_acl_group",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_add_user_roles",
    "Assign roles (Curator=1, Supervisor=2) to users within ACL groups. dry_run=true by default.",
    {
      ...addRolesShape,
      roleInfo: addRolesShape.roleInfo.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_add_user_roles",
        dry_run: params.dry_run,
        role_count: params.roleInfo.length,
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
                endpoint: "POST /api/external/v2/aclgroups/roles/add",
                payload: { roleInfo: params.roleInfo },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/aclgroups/roles/add",
          body: { roleInfo: params.roleInfo },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_add_user_roles",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_remove_user_roles",
    "Remove roles from users within ACL groups. dry_run=true by default.",
    {
      ...removeRolesShape,
      roleInfo: removeRolesShape.roleInfo.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_remove_user_roles",
        dry_run: params.dry_run,
        role_count: params.roleInfo.length,
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
                endpoint: "POST /api/external/v2/aclgroups/roles/remove",
                payload: { roleInfo: params.roleInfo },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/aclgroups/roles/remove",
          body: { roleInfo: params.roleInfo },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_remove_user_roles",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_add_user_mentors",
    "Assign a mentor to mentees in Eventicious. dry_run=true by default.",
    {
      ...addMentorsShape,
      menteeIds: addMentorsShape.menteeIds.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_add_user_mentors",
        dry_run: params.dry_run,
        mentor_id: params.mentorId,
        mentee_count: params.menteeIds.length,
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
                endpoint: "POST /api/external/v2/users/mentor",
                payload: { mentorId: params.mentorId, menteeIds: params.menteeIds },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/users/mentor",
          body: { mentorId: params.mentorId, menteeIds: params.menteeIds },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_add_user_mentors",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  server.tool(
    "eventicious_remove_user_mentors",
    "Remove a mentor from mentees in Eventicious. dry_run=true by default.",
    {
      ...removeMentorsShape,
      menteeIds: removeMentorsShape.menteeIds.max(maxUsers),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_remove_user_mentors",
        dry_run: params.dry_run,
        mentor_id: params.mentorId,
        mentee_count: params.menteeIds.length,
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
                endpoint: "DELETE /api/external/v2/users/mentor",
                payload: { mentorId: params.mentorId, menteeIds: params.menteeIds },
              }),
            },
          ],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "DELETE",
          endpoint: "/api/external/v2/users/mentor",
          body: { mentorId: params.mentorId, menteeIds: params.menteeIds },
          credentials,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(res.data) },
          ],
        };
      } catch (e) {
        logger.error("eventicious_api_error", {
          tool: "eventicious_remove_user_mentors",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  registerLocationTools(server, credentials);
  registerTagTools(server, credentials);
  registerSessionTools(server, credentials);
  registerSessionAttachmentTools(server, credentials);
  registerScheduleImportTools(server, credentials);
  registerCatalogTools(server, credentials, toolError);
  registerCatalogElementTools(server, credentials, toolError);
  registerGravityJsonTools(server, toolError);
  registerCatalogImportTools(server, toolError);
  registerCourseTools(server, credentials, toolError);
  registerPollTools(server, credentials, toolError);
  registerTaskContentTools(server, credentials, toolError);
  registerScormTools(server, credentials, toolError);
  registerGamificationTools(server, credentials, toolError);
  registerCourseImportTools(server, toolError);
  registerExpoTools(server, credentials, toolError);
}
