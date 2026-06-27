import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { logger } from "../logger";
import { gamificationManualChargeSchema } from "../schemas/gamification";

export function registerGamificationTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true }
) {
  server.tool(
    "eventicious_add_manual_gamification_charge",
    "Manually add gamification points to a user. Requires dry_run=false + confirm=true for real execution.",
    gamificationManualChargeSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_add_manual_gamification_charge", dry_run: params.dry_run, externalId: params.externalId, scores: params.scores });
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, preview: { externalId: params.externalId, scores: params.scores, reason: params.reason } }) }] };
      }
      if (!params.confirm) return toolError("confirm=true required for gamification charge");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/gamification/add-manual-charge", body: { externalId: params.externalId, scores: params.scores, reason: params.reason }, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { success: true }) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );
}
