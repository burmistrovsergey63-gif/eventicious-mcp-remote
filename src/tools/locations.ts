import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest } from "../eventicious-client";
import { EventiciousRequestInfo } from "../auth";
import { logger } from "../logger";
import {
  createLocationShape,
  updateLocationShape,
  deleteLocationShape,
} from "../schemas/locations";

export function registerLocationTools(
  server: McpServer,
  credentials: ReturnType<typeof import("../auth").extractEventiciousCredentials>,
  requestContext?: EventiciousRequestInfo,
  acceptLanguage?: string
) {
  server.tool(
    "eventicious_create_location",
    "Create a location in Eventicious schedule. dry_run=true by default. For Russian text use UTF-8.",
    createLocationShape,
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
          ...(requestContext ? { requestContext } : {}),
          ...(acceptLanguage ? { acceptLanguage } : {}),
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
    "Update a location in Eventicious schedule. dry_run=true by default. For Russian text use UTF-8.",
    updateLocationShape,
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
          ...(requestContext ? { requestContext } : {}),
          ...(acceptLanguage ? { acceptLanguage } : {}),
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
    deleteLocationShape,
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
          ...(requestContext ? { requestContext } : {}),
          ...(acceptLanguage ? { acceptLanguage } : {}),
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_delete_location", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );
}
