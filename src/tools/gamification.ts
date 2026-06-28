import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { logger } from "../logger";
import { gamificationManualChargeSchema, gamificationValidateChargeSchema } from "../schemas/gamification";

export function registerGamificationTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true }
) {
  // --- eventicious_add_manual_gamification_charge ---
  server.tool(
    "eventicious_add_manual_gamification_charge",
    "Manually charge or write-off gamification points for a user. Positive scores = charge, negative scores = write-off. Requires dry_run=false + confirm=true for real execution.",
    gamificationManualChargeSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_add_manual_gamification_charge", dry_run: params.dry_run, externalId: params.externalId, scores: params.scores });
      const operation = params.scores > 0 ? "charge" : "write-off";
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, operation, preview: { externalId: params.externalId, scores: params.scores, reason: params.reason } }) }] };
      }
      if (!params.confirm) return toolError("confirm=true required for gamification charge");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/gamification/add-manual-charge", body: { externalId: params.externalId, scores: params.scores, reason: params.reason }, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { success: true }) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  // --- eventicious_validate_gamification_charge ---
  server.tool(
    "eventicious_validate_gamification_charge",
    "Validate gamification charge/write-off parameters. No Eventicious API call.",
    gamificationValidateChargeSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_validate_gamification_charge", externalId: params.externalId, scores: params.scores });
      const errors: string[] = [];
      const warnings: string[] = [];

      if (params.scores === 0) {
        errors.push("Scores cannot be zero");
      }
      if (Math.abs(params.scores) > 10000) {
        warnings.push(`Scores absolute value (${Math.abs(params.scores)}) exceeds recommended limit of 10000`);
      }

      const operation = params.scores > 0 ? "charge" : "write-off";

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            valid: errors.length === 0,
            operation,
            externalId: params.externalId,
            scores: params.scores,
            reason: params.reason,
            errors,
            warnings,
          }),
        }],
      };
    }
  );
}
