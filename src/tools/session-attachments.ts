import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest } from "../eventicious-client";
import { logger } from "../logger";
import {
  createSessionAttachmentShape,
  updateSessionAttachmentShape,
  deleteSessionAttachmentShape,
} from "../schemas/session-attachments";

export function registerSessionAttachmentTools(
  server: McpServer,
  credentials: ReturnType<typeof import("../auth").extractEventiciousCredentials>
) {
  server.tool(
    "eventicious_create_session_attachment",
    "Create an attachment (link) for a schedule session. dry_run=true by default.",
    createSessionAttachmentShape,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_create_session_attachment", dry_run: params.dry_run, session_id: params.sessionId, attachment_id: params.id });

      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
      }

      const payload = { id: params.id, title: params.title, url: params.url };

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ dry_run: true, endpoint: `POST /api/external/v2/sessions/${params.sessionId}/attachments/create`, payload }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/sessions/${params.sessionId}/attachments/create`, body: payload, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_create_session_attachment", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );

  server.tool(
    "eventicious_update_session_attachment",
    "Update an attachment for a schedule session. dry_run=true by default.",
    updateSessionAttachmentShape,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_update_session_attachment", dry_run: params.dry_run, session_id: params.sessionId, attachment_id: params.attachmentId });

      if (!params.dry_run && !params.confirm) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
      }

      const payload: Record<string, unknown> = {};
      if (params.title !== undefined) payload.title = params.title;
      if (params.url !== undefined) payload.url = params.url;

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ dry_run: true, endpoint: `PUT /api/external/v2/sessions/${params.sessionId}/attachments/update/${params.attachmentId}`, payload }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({ method: "PUT", endpoint: `/api/external/v2/sessions/${params.sessionId}/attachments/update/${params.attachmentId}`, body: payload, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_update_session_attachment", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );

  server.tool(
    "eventicious_delete_session_attachment",
    "Permanently delete an attachment from a session. Requires danger_confirm='DELETE_EVENTICIOUS_SESSION_ATTACHMENTS'. dry_run=true by default.",
    deleteSessionAttachmentShape,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_session_attachment", dry_run: params.dry_run, session_id: params.sessionId, attachment_id: params.attachmentId });

      if (!params.dry_run) {
        if (!params.confirm) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true as const };
        if (params.danger_confirm !== "DELETE_EVENTICIOUS_SESSION_ATTACHMENTS") return { content: [{ type: "text" as const, text: JSON.stringify({ error: "danger_confirm='DELETE_EVENTICIOUS_SESSION_ATTACHMENTS' required" }) }], isError: true as const };
      }

      if (params.dry_run) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ dry_run: true, endpoint: `DELETE /api/external/v2/sessions/${params.sessionId}/attachments/delete/${params.attachmentId}` }),
          }],
        };
      }

      try {
        const res = await eventiciousRequest({ method: "DELETE", endpoint: `/api/external/v2/sessions/${params.sessionId}/attachments/delete/${params.attachmentId}`, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (e) {
        logger.error("eventicious_api_error", { tool: "eventicious_delete_session_attachment", error: e instanceof Error ? e.message : "Unknown" });
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true as const };
      }
    }
  );
}