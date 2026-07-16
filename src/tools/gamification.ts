import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { EventiciousRequestInfo } from "../auth";
import { logger } from "../logger";
import { gamificationManualChargeSchema, gamificationValidateChargeSchema } from "../schemas/gamification";

export function registerGamificationTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true },
  requestContext?: EventiciousRequestInfo,
  acceptLanguage?: string
) {
  // --- eventicious_add_manual_gamification_charge ---
  server.tool(
    "eventicious_add_manual_gamification_charge",
    "Manually charge or write-off gamification points for a user. Positive scores = charge, negative scores = write-off. Requires dry_run=false + confirm=true for real execution. For Russian text use UTF-8.",
    gamificationManualChargeSchema,
    async (params) => {
      const s = Number(params.scores);
      logger.info("tool_call", { tool: "eventicious_add_manual_gamification_charge", dry_run: params.dry_run, externalId: params.externalId, scores: s });
      const operation = s > 0 ? "charge" : "write-off";
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, operation, preview: { externalId: params.externalId, scores: s, reason: params.reason } }) }] };
      }
      if (!params.confirm) return toolError("confirm=true required for gamification charge");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/gamification/add-manual-charge", body: { externalId: params.externalId, scores: s, reason: params.reason }, credentials, ...(requestContext ? { requestContext } : {}), ...(acceptLanguage ? { acceptLanguage } : {}) });
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

      const s = Number(params.scores);
      if (s === 0 || isNaN(s)) {
        errors.push("Scores cannot be zero");
      }
      if (Math.abs(s) > 10000) {
        warnings.push(`Scores absolute value (${Math.abs(s)}) exceeds recommended limit of 10000`);
      }

      const operation = s > 0 ? "charge" : "write-off";

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
