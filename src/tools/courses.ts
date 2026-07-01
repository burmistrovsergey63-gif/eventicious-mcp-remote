import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { logger } from "../logger";
import {
  courseImportSchema,
  courseFinalizeSchema,
  courseImageUploadSchema,
} from "../schemas/courses";
import { requireDangerConfirm } from "../utils/confirm";

export function registerCourseTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true }
) {
  server.tool(
    "eventicious_import_course_structure",
    "Create a new course with stages. Returns IDs for polls, tasks, SCORM placeholders, and catalogs. Requires pre-uploaded cover image IDs. For Russian text use UTF-8.",
    courseImportSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_import_course_structure", dry_run: params.dry_run, name: params.name });
      const { dry_run, confirm, ...body } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, preview: { name: body.name, description: body.description, stagesCount: body.stages?.length ?? 0, settings: body.settings } }) }] };
      if (!confirm) return toolError("confirm=true required to import course structure");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/courses", body, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_finalize_course",
    "Finalize a draft course so it becomes visible/active. Requires danger_confirm='FINALIZE_EVENTICIOUS_COURSE'. Use eventicious_check_course_ready_to_finalize first.",
    courseFinalizeSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_finalize_course", dry_run: params.dry_run, courseId: params.courseId });
      if (params.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, courseId: params.courseId, message: "Finalize would activate this course" }) }] };
      if (!params.confirm) return toolError("confirm=true required to finalize course");
      if (!requireDangerConfirm(params.danger_confirm, "FINALIZE_EVENTICIOUS_COURSE")) return toolError("danger_confirm='FINALIZE_EVENTICIOUS_COURSE' required");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/courses/${params.courseId}/finalize`, body: {}, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { success: true }) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_upload_course_images",
    "Upload course cover images and thumbnails. Returns fileId and thumbnailFileId pairs. Max 10 images, jpg/png only. For real upload, provide actual file paths.",
    courseImageUploadSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_upload_course_images", dry_run: params.dry_run, file_count: params.filePaths.length });
      if (params.dry_run) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, preview: { filePaths: params.filePaths, note: "Real upload sends multipart/form-data to POST /api/external/v2/images/upload?generateThumbnails=true. Returns fileId + thumbnailFileId for each image." } }) }] };
      }
      if (!params.confirm) return toolError("confirm=true required to upload images");
      try {
        const formData = new FormData();
        for (const fp of params.filePaths) {
          const fs = await import("fs");
          const path = await import("path");
          const buffer = fs.readFileSync(fp);
          const blob = new Blob([buffer]);
          formData.append("file", blob, path.basename(fp));
        }
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/images/upload?generateThumbnails=true", body: formData, credentials, isMultipart: true });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );
}
