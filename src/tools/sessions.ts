import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { eventiciousRequest } from "../eventicious-client";
import { logger } from "../logger";

export function registerSessionTools(
  server: McpServer,
  credentials: ReturnType<typeof import("../auth").extractEventiciousCredentials>
) {
  server.tool(
    "eventicious_create_session",
    "Create a schedule session (event) in Eventicious. dry_run=true by default. Note: API uses speakersIds (not speakerIds) and locationsIds (not locationIds).",
    {
      id: z.number().describe("Session ID in your external system"),
      title: z.string().describe("Session title"),
      description: z.string().optional().describe("HTML supported"),
      startTime: z.string().describe("ISO 8601 e.g. 2026-09-01T10:00"),
      endTime: z.string().describe("ISO 8601"),
      tagIds: z.array(z.number()).optional().describe("Array of tag IDs"),
      speakersIds: z.array(z.number()).optional().describe("Array of speaker (user) IDs — docs use speakersIds"),
      locationsIds: z.array(z.number()).optional().describe("Array of location IDs — docs use locationsIds"),
      aclGroupsIds: z.array(z.number()).optional().describe("Array of ACL group IDs for visibility"),
      type: z.number().optional().describe("0=speech, 1=coffee-break, 2=filler"),
      color: z.string().optional().describe("Hex color"),
      externalImagePath: z.string().optional().describe("URL to session image"),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_create_session", dry_run: params.dry_run, session_id: params.id });

      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
      }

      const payload: Record<string, unknown> = {
        id: params.id,
        title: params.title,
        startTime: params.startTime,
        endTime: params.endTime,
      };
      if (params.description !== undefined) payload.description = params.description;
      if (params.tagIds !== undefined) payload.tagIds = params.tagIds;
      if (params.speakersIds !== undefined) payload.speakersIds = params.speakersIds;
      if (params.locationsIds !== undefined) payload.locationsIds = params.locationsIds;
      if (params.aclGroupsIds !== undefined) payload.aclGroupsIds = params.aclGroupsIds;
      if (params.type !== undefined) payload.type = params.type;
      if (params.color !== undefined) payload.color = params.color;
      if (params.externalImagePath !== undefined) payload.externalImagePath = params.externalImagePath;

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/sessions/create", payload }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/sessions/create", body: payload, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_create_session", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );

  server.tool(
    "eventicious_update_session",
    "Update a schedule session in Eventicious. dry_run=true by default.",
    {
      id: z.number().describe("Session ID"),
      title: z.string().optional(),
      description: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      tagIds: z.array(z.number()).optional(),
      speakersIds: z.array(z.number()).optional(),
      locationsIds: z.array(z.number()).optional(),
      aclGroupsIds: z.array(z.number()).optional(),
      type: z.number().optional(),
      color: z.string().optional(),
      externalImagePath: z.string().optional(),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_update_session", dry_run: params.dry_run, session_id: params.id });

      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
      }

      const payload: Record<string, unknown> = {};
      if (params.title !== undefined) payload.title = params.title;
      if (params.description !== undefined) payload.description = params.description;
      if (params.startTime !== undefined) payload.startTime = params.startTime;
      if (params.endTime !== undefined) payload.endTime = params.endTime;
      if (params.tagIds !== undefined) payload.tagIds = params.tagIds;
      if (params.speakersIds !== undefined) payload.speakersIds = params.speakersIds;
      if (params.locationsIds !== undefined) payload.locationsIds = params.locationsIds;
      if (params.aclGroupsIds !== undefined) payload.aclGroupsIds = params.aclGroupsIds;
      if (params.type !== undefined) payload.type = params.type;
      if (params.color !== undefined) payload.color = params.color;
      if (params.externalImagePath !== undefined) payload.externalImagePath = params.externalImagePath;

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ dry_run: true, endpoint: `PUT /api/external/v2/sessions/update/${params.id}`, payload }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({ method: "PUT", endpoint: `/api/external/v2/sessions/update/${params.id}`, body: payload, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_update_session", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );

  server.tool(
    "eventicious_delete_session",
    "Permanently delete a schedule session from Eventicious. Requires danger_confirm='DELETE_EVENTICIOUS_SESSIONS'. dry_run=true by default.",
    {
      id: z.number().describe("Session ID"),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
      danger_confirm: z.literal("DELETE_EVENTICIOUS_SESSIONS").optional().describe("Exact string required for real deletion"),
    },
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_session", dry_run: params.dry_run, session_id: params.id });

      if (!params.dry_run) {
        if (!params.confirm) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
        if (params.danger_confirm !== "DELETE_EVENTICIOUS_SESSIONS") return { content: [{ type: "text" as const, text: JSON.stringify({ error: "danger_confirm='DELETE_EVENTICIOUS_SESSIONS' required" }) }], isError: true as const };
      }

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ dry_run: true, endpoint: `DELETE /api/external/v2/sessions/delete/${params.id}` }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({ method: "DELETE", endpoint: `/api/external/v2/sessions/delete/${params.id}`, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_delete_session", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );
}
