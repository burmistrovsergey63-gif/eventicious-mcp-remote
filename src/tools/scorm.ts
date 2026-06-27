import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { logger } from "../logger";
import { scormUploadSchema } from "../schemas/scorm";

export function registerScormTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true }
) {
  server.tool(
    "eventicious_upload_scorm_to_stage",
    "Upload a SCORM .zip archive to a specific course stage. Requires scormId from course import response.",
    scormUploadSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_upload_scorm_to_stage", dry_run: params.dry_run, courseId: params.courseId, stageId: params.stageId, scormId: params.scormId });
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, courseId: params.courseId, stageId: params.stageId, scormId: params.scormId, preview: { filePath: params.filePath, note: "Real upload sends multipart/form-data to POST /api/external/v2/courses/{courseId}/stages/{stageId}/scorm/{scormId}/upload" } }) }] };
      }
      if (!params.confirm) return toolError("confirm=true required to upload SCORM");
      try {
        const fs = await import("fs");
        const path = await import("path");
        const buffer = fs.readFileSync(params.filePath);
        const blob = new Blob([buffer]);
        const formData = new FormData();
        formData.append("file", blob, path.basename(params.filePath));
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/courses/${params.courseId}/stages/${params.stageId}/scorm/${params.scormId}/upload`, body: formData, credentials, isMultipart: true });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { success: true }) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );
}
