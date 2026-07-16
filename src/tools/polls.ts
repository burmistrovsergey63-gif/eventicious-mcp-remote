import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { EventiciousRequestInfo } from "../auth";
import { logger } from "../logger";
import { pollImportSchema } from "../schemas/polls";

export function registerPollTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true },
  requestContext?: EventiciousRequestInfo,
  acceptLanguage?: string
) {
  server.tool(
    "eventicious_import_poll_content",
    "Fill a poll/test placeholder with content. Use pollId from course import response. Supports Common, TestWithoutAnswers, TestWithAnswers types.",
    pollImportSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_import_poll_content", dry_run: params.dry_run, pollId: params.pollId, type: params.type });
      const { dry_run, confirm, pollId, ...body } = params;
      if (dry_run) {
        const preview = { name: body.name, type: body.type, screensCount: body.screens.length, questionsCount: body.screens.reduce((sum: number, s: { questions: unknown[] }) => sum + s.questions.length, 0) };
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, pollId, preview }) }] };
      }
      if (!confirm) return toolError("confirm=true required to import poll content");
      try {
        const res = await eventiciousRequest({ method: "PUT", endpoint: `/api/external/v2/polls/${pollId}`, body, credentials, ...(requestContext ? { requestContext } : {}), ...(acceptLanguage ? { acceptLanguage } : {}) });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );
}
