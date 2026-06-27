import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { eventiciousRequest } from "../eventicious-client";
import { logger } from "../logger";

export function registerTagTools(
  server: McpServer,
  credentials: ReturnType<typeof import("../auth").extractEventiciousCredentials>
) {
  server.tool(
    "eventicious_create_tag",
    "Create a tag (topic) in Eventicious schedule. dry_run=true by default.",
    {
      id: z.number().describe("Tag ID in your external system"),
      name: z.string().describe("Tag name"),
      color: z.string().optional().describe("Hex color e.g. #ABCDEF"),
      visibilityFlag: z.number().optional().describe("0=hidden, 1=visible on session card"),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_create_tag", dry_run: params.dry_run, tag_id: params.id });

      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
      }

      const payload: Record<string, unknown> = { id: params.id, name: params.name };
      if (params.color !== undefined) payload.color = params.color;
      if (params.visibilityFlag !== undefined) payload.visibilityFlag = params.visibilityFlag;

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/tags/create", payload }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/tags/create", body: payload, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_create_tag", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );

  server.tool(
    "eventicious_update_tag",
    "Update a tag (topic) in Eventicious schedule. dry_run=true by default.",
    {
      id: z.number().describe("Tag ID"),
      name: z.string().describe("New tag name"),
      color: z.string().optional(),
      visibilityFlag: z.number().optional(),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_update_tag", dry_run: params.dry_run, tag_id: params.id });

      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
      }

      const payload: Record<string, unknown> = { name: params.name };
      if (params.color !== undefined) payload.color = params.color;
      if (params.visibilityFlag !== undefined) payload.visibilityFlag = params.visibilityFlag;

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ dry_run: true, endpoint: `PUT /api/external/v2/tags/update/${params.id}`, payload }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({ method: "PUT", endpoint: `/api/external/v2/tags/update/${params.id}`, body: payload, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_update_tag", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );

  server.tool(
    "eventicious_delete_tag",
    "Permanently delete a tag from Eventicious schedule. Requires danger_confirm='DELETE_EVENTICIOUS_TAGS'. dry_run=true by default.",
    {
      id: z.number().describe("Tag ID"),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
      danger_confirm: z.literal("DELETE_EVENTICIOUS_TAGS").optional().describe("Exact string required for real deletion"),
    },
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_tag", dry_run: params.dry_run, tag_id: params.id });

      if (!params.dry_run) {
        if (!params.confirm) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
        if (params.danger_confirm !== "DELETE_EVENTICIOUS_TAGS") return { content: [{ type: "text" as const, text: JSON.stringify({ error: "danger_confirm='DELETE_EVENTICIOUS_TAGS' required" }) }], isError: true as const };
      }

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ dry_run: true, endpoint: `DELETE /api/external/v2/tags/delete/${params.id}` }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({ method: "DELETE", endpoint: `/api/external/v2/tags/delete/${params.id}`, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_delete_tag", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );
}
