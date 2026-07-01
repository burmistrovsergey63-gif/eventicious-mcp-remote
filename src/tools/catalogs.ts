import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { logger } from "../logger";
import {
  catalogCreateSchema,
  catalogUpdateSchema,
  catalogDeleteSchema,
} from "../schemas/catalogs";
import { requireDangerConfirm } from "../utils/confirm";

export function registerCatalogTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true }
) {
  server.tool(
    "eventicious_list_catalogs",
    "List all root catalogs for the event.",
    {},
    async () => {
      logger.info("tool_call", { tool: "eventicious_list_catalogs" });
      try {
        const res = await eventiciousRequest({
          method: "GET",
          endpoint: "/api/external/v2/catalogs",
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) {
        return toolError(String(err));
      }
    }
  );

  server.tool(
    "eventicious_get_catalog",
    "Get a single catalog or folder by ID with all its elements.",
    { catalogId: z.number().int().describe("Catalog or folder ID") },
    async ({ catalogId }) => {
      logger.info("tool_call", { tool: "eventicious_get_catalog", catalogId });
      try {
        const res = await eventiciousRequest({
          method: "GET",
          endpoint: `/api/external/v2/catalogs/${catalogId}`,
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) {
        return toolError(String(err));
      }
    }
  );

  server.tool(
    "eventicious_create_catalog",
    "Create a new root catalog. For Russian text use UTF-8.",
    catalogCreateSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_create_catalog", dry_run: params.dry_run });
      const { dry_run, confirm, ...body } = params;
      if (dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, preview: body }) }] };
      }
      if (!confirm) {
        return toolError("confirm=true required to create catalog");
      }
      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/catalogs",
          body,
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) {
        return toolError(String(err));
      }
    }
  );

  server.tool(
    "eventicious_update_catalog",
    "Update an existing catalog. For Russian text use UTF-8.",
    catalogUpdateSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_update_catalog", catalogId: params.catalogId, dry_run: params.dry_run });
      const { dry_run, confirm, catalogId, ...body } = params;
      if (dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId, preview: body }) }] };
      }
      if (!confirm) {
        return toolError("confirm=true required to update catalog");
      }
      try {
        const res = await eventiciousRequest({
          method: "PUT",
          endpoint: `/api/external/v2/catalogs/${catalogId}`,
          body,
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) {
        return toolError(String(err));
      }
    }
  );

  server.tool(
    "eventicious_delete_catalog",
    "Delete a catalog and all its contents. Requires danger_confirm='DELETE_EVENTICIOUS_CATALOG'.",
    catalogDeleteSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_catalog", catalogId: params.catalogId, dry_run: params.dry_run });
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId: params.catalogId }) }] };
      }
      if (!params.confirm) {
        return toolError("confirm=true required to delete catalog");
      }
      if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_CATALOG")) {
        return toolError("danger_confirm='DELETE_EVENTICIOUS_CATALOG' required");
      }
      try {
        const res = await eventiciousRequest({
          method: "DELETE",
          endpoint: `/api/external/v2/catalogs/${params.catalogId}`,
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) {
        return toolError(String(err));
      }
    }
  );
}
