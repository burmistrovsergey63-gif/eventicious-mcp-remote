import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { EventiciousRequestInfo } from "../auth";
import { logger } from "../logger";
import { taskContentImportSchema, taskAttachmentUploadSchema } from "../schemas/task-contents";

export function registerTaskContentTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true },
  requestContext?: EventiciousRequestInfo,
  acceptLanguage?: string
) {
  server.tool(
    "eventicious_import_task_content",
    "Fill a task content placeholder with title, fields, settings, and attachments. Use taskContentId from course import response.",
    taskContentImportSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_import_task_content", dry_run: params.dry_run, taskContentId: params.taskContentId });
      const { dry_run, confirm, taskContentId, ...body } = params;
      if (dry_run) {
        const preview = { title: body.title, fieldsCount: body.fields?.length ?? 0, hasSettings: !!body.settings, attachmentCount: body.attachmentFileIds?.length ?? 0 };
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, taskContentId, preview }) }] };
      }
      if (!confirm) return toolError("confirm=true required to import task content");
      try {
        const res = await eventiciousRequest({ method: "PUT", endpoint: `/api/external/v2/task-contents/${taskContentId}`, body, credentials, ...(requestContext ? { requestContext } : {}), ...(acceptLanguage ? { acceptLanguage } : {}) });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_upload_task_attachments",
    "Upload task attachment files before task content import. Max 5 files per request.",
    taskAttachmentUploadSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_upload_task_attachments", dry_run: params.dry_run, file_count: params.filePaths.length });
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, preview: { filePaths: params.filePaths, note: "Real upload sends multipart/form-data to POST /api/external/v2/task-contents/attachments/upload. Returns id+name+url for each file." } }) }] };
      }
      if (!params.confirm) return toolError("confirm=true required to upload task attachments");
      try {
        const formData = new FormData();
        for (const fp of params.filePaths) {
          const fs = await import("fs");
          const path = await import("path");
          const buffer = fs.readFileSync(fp);
          const blob = new Blob([buffer]);
          formData.append("file", blob, path.basename(fp));
        }
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/task-contents/attachments/upload", body: formData, credentials, isMultipart: true, ...(requestContext ? { requestContext } : {}), ...(acceptLanguage ? { acceptLanguage } : {}) });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );
}
