import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { eventiciousRequest } from "../eventicious-client";
import { logger } from "../logger";
import { config } from "../config";

export function registerLocationTools(
  server: McpServer,
  credentials: ReturnType<typeof import("../auth").extractEventiciousCredentials>
) {
  server.tool(
    "eventicious_create_location",
    "Create a location in Eventicious schedule. dry_run=true by default.",
    {
      id: z.number().describe("Location ID in your external system"),
      name: z.string().describe("Location name"),
      position: z.number().describe("Unique position number for display order"),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      logger.info("tool_call", {
        tool: "eventicious_create_location",
        dry_run: params.dry_run,
        location_id: params.id,
      });

      if (!params.dry_run && !params.confirm) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }],
          isError: true as const,
        };
      }

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              dry_run: true,
              endpoint: "POST /api/external/v2/locations/create",
              payload: { id: params.id, name: params.name, position: params.position },
            }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/locations/create",
          body: { id: params.id, name: params.name, position: params.position },
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_create_location", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );

  server.tool(
    "eventicious_update_location",
    "Update a location in Eventicious schedule. dry_run=true by default.",
    {
      id: z.number().describe("Location ID"),
      name: z.string().describe("New location name"),
      position: z.number().describe("Position number"),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
    },
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_update_location", dry_run: params.dry_run, location_id: params.id });

      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
      }

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              dry_run: true,
              endpoint: `PUT /api/external/v2/locations/update/${params.id}`,
              payload: { name: params.name, position: params.position },
            }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "PUT",
          endpoint: `/api/external/v2/locations/update/${params.id}`,
          body: { name: params.name, position: params.position },
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_update_location", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );

  server.tool(
    "eventicious_delete_location",
    "Permanently delete a location from Eventicious schedule. Requires danger_confirm='DELETE_EVENTICIOUS_LOCATIONS'. dry_run=true by default.",
    {
      id: z.number().describe("Location ID"),
      dry_run: z.boolean().default(true),
      confirm: z.boolean().default(false),
      danger_confirm: z.literal("DELETE_EVENTICIOUS_LOCATIONS").optional().describe("Exact string required for real deletion"),
    },
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_location", dry_run: params.dry_run, location_id: params.id });

      if (!params.dry_run) {
        if (!params.confirm) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
        if (params.danger_confirm !== "DELETE_EVENTICIOUS_LOCATIONS") return { content: [{ type: "text" as const, text: JSON.stringify({ error: "danger_confirm='DELETE_EVENTICIOUS_LOCATIONS' required" }) }], isError: true as const };
      }

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              dry_run: true,
              endpoint: `DELETE /api/external/v2/locations/delete/${params.id}`,
            }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "DELETE",
          endpoint: `/api/external/v2/locations/delete/${params.id}`,
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_delete_location", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );
}
