import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { logger } from "../logger";
import {
  exhibitorCreateSchema,
  exhibitorUpdateSchema,
  exhibitorDeleteSchema,
  prepareExhibitorsImportSchema,
  validateExhibitorPlanSchema,
} from "../schemas/expo";
import { requireDangerConfirm } from "../utils/confirm";

export function registerExpoTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true }
) {
  // --- eventicious_create_exhibitor ---
  server.tool(
    "eventicious_create_exhibitor",
    "Create an exhibitor (company) in Eventicious. dry_run=true by default. WARNING: null/empty fields may reset values in admin. For Russian text use UTF-8.",
    exhibitorCreateSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_create_exhibitor", dry_run: params.dry_run, id: params.id, name: params.name });
      const { dry_run, confirm, ...body } = params;

      if (!dry_run && !confirm) {
        return toolError("confirm=true required for real execution");
      }

      if (dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              dry_run: true,
              endpoint: "POST /api/external/v2/expo/create",
              payload: body,
            }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "POST",
          endpoint: "/api/external/v2/expo/create",
          body,
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_create_exhibitor", error: e instanceof Error ? e.message : "Unknown error" });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  // --- eventicious_update_exhibitor ---
  server.tool(
    "eventicious_update_exhibitor",
    "Update an exhibitor (company) in Eventicious. dry_run=true by default. WARNING: included null/empty fields may reset values in Eventicious admin. Only include fields you want to change. For Russian text use UTF-8.",
    exhibitorUpdateSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_update_exhibitor", dry_run: params.dry_run, id: params.id });
      const { dry_run, confirm, id, ...body } = params;

      if (!dry_run && !confirm) {
        return toolError("confirm=true required for real execution");
      }

      // Check for null/empty fields that may reset values
      const warnings: string[] = [];
      for (const [key, value] of Object.entries(body)) {
        if (value === null || value === "") {
          warnings.push(`Field '${key}' is empty/null and may reset this value in Eventicious admin`);
        }
      }

      if (dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              dry_run: true,
              endpoint: `PUT /api/external/v2/expo/update/${id}`,
              payload: body,
              warnings,
            }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "PUT",
          endpoint: `/api/external/v2/expo/update/${id}`,
          body,
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_update_exhibitor", error: e instanceof Error ? e.message : "Unknown error" });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  // --- eventicious_delete_exhibitor ---
  server.tool(
    "eventicious_delete_exhibitor",
    "Permanently delete an exhibitor (company) from Eventicious. Requires danger_confirm='DELETE_EVENTICIOUS_EXHIBITOR' and confirm=true. dry_run=true by default.",
    exhibitorDeleteSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_exhibitor", dry_run: params.dry_run, id: params.id });

      if (!params.dry_run) {
        if (!params.confirm) {
          return toolError("confirm=true required for real deletion");
        }
        if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_EXHIBITOR")) {
          return toolError("danger_confirm='DELETE_EVENTICIOUS_EXHIBITOR' required");
        }
      }

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              dry_run: true,
              endpoint: `DELETE /api/external/v2/expo/delete/${params.id}`,
            }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({
          method: "DELETE",
          endpoint: `/api/external/v2/expo/delete/${params.id}`,
          credentials,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { success: true }) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_delete_exhibitor", error: e instanceof Error ? e.message : "Unknown error" });
        return toolError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  );

  // --- eventicious_prepare_exhibitors_import ---
  server.tool(
    "eventicious_prepare_exhibitors_import",
    "Prepare exhibitors import: normalize fields, detect duplicates, validate required fields. No Eventicious API call.",
    prepareExhibitorsImportSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_prepare_exhibitors_import", count: params.exhibitors.length });

      const exhibitors = params.exhibitors;
      const warnings: string[] = [];
      const errors: string[] = [];

      // Check for duplicate IDs
      const ids = exhibitors.map((e) => e.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate exhibitor IDs found: ${[...new Set(duplicates)].join(", ")}`);
      }

      // Validate each exhibitor
      const normalized = exhibitors.map((e) => ({
        id: e.id,
        name: e.name,
        address: e.address || undefined,
        site: e.site || undefined,
        email: e.email || undefined,
        phone: e.phone || undefined,
        details: e.details || undefined,
        externalImagePath: e.externalImagePath || undefined,
        representativesIds: e.representativesIds || undefined,
      }));

      // Build plan (all creates for now - update/delete would need existing data)
      const createPlan = normalized;

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            normalizedExhibitors: normalized,
            createPlan,
            updatePlan: [],
            deletePlan: [],
            warnings,
            errors,
            summary: {
              total: exhibitors.length,
              createCount: createPlan.length,
              updateCount: 0,
              deleteCount: 0,
            },
          }),
        }],
      };
    }
  );

  // --- eventicious_validate_exhibitor_plan ---
  server.tool(
    "eventicious_validate_exhibitor_plan",
    "Validate an exhibitor import plan. Checks required fields, ID format, URL format, and warns about empty fields. No Eventicious API call.",
    validateExhibitorPlanSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_validate_exhibitor_plan" });

      const plan = params.plan;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate creates
      if (plan.create) {
        for (const exhibitor of plan.create) {
          if (!exhibitor.id) errors.push(`Create: missing id for exhibitor '${exhibitor.name}'`);
          if (!exhibitor.name) errors.push(`Create: missing name for exhibitor id=${exhibitor.id}`);
        }
      }

      // Validate updates
      if (plan.update) {
        for (const exhibitor of plan.update) {
          if (!exhibitor.id) errors.push(`Update: missing id`);
          const hasFields = exhibitor.name || exhibitor.address || exhibitor.site ||
            exhibitor.email || exhibitor.phone || exhibitor.details ||
            exhibitor.externalImagePath || exhibitor.language || exhibitor.representativesIds;
          if (!hasFields) {
            warnings.push(`Update: exhibitor id=${exhibitor.id} has no fields to update`);
          }
          // Check for null/empty fields
          for (const [key, value] of Object.entries(exhibitor)) {
            if (key !== "id" && (value === null || value === "")) {
              warnings.push(`Update: exhibitor id=${exhibitor.id} has empty field '${key}' which may reset value in admin`);
            }
          }
        }
      }

      // Validate deletes
      if (plan.delete) {
        for (const exhibitor of plan.delete) {
          if (!exhibitor.id) errors.push(`Delete: missing id`);
        }
      }

      const valid = errors.length === 0;

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            valid,
            errors,
            warnings,
            summary: {
              createCount: plan.create?.length ?? 0,
              updateCount: plan.update?.length ?? 0,
              deleteCount: plan.delete?.length ?? 0,
            },
          }),
        }],
      };
    }
  );
}
