import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { EventiciousRequestInfo } from "../auth";
import { logger } from "../logger";
import {
  courseImportSchema,
  courseFinalizeSchema,
  courseImageUploadSchema,
} from "../schemas/courses";
import { requireDangerConfirm } from "../utils/confirm";
import { normalizeCourseStructureForEventiciousApi } from "../utils/course-structure-normalizer";

export function registerCourseTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true },
  requestContext?: EventiciousRequestInfo,
  acceptLanguage?: string
) {
  server.tool(
    "eventicious_import_course_structure",
    "Create a new course with full skeleton. Returns IDs for polls, tasks, SCORM placeholders, and catalogs. Requires pre-uploaded coverImageFileId+coverImageThumbnailFileId. Always dry_run first — Eventicious returns HTTP 500 on incomplete payload. Include: name, description, externalId, settings (progress, finalScreen, deadline with sendingPeriods, isFreeOrderAllowed), and complete stages[] with taskContent.title for Task stages and poll metadata for PassTest/PassPoll. Use PascalCase enums (Common/Task/Scorm, CheckInformation/PassTest/PassPoll). For Russian text use UTF-8.",
    courseImportSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_import_course_structure", dry_run: params.dry_run, name: params.name });
      const { dry_run, confirm, ...body } = params;
      const { payload: normalizedBody, warnings } = normalizeCourseStructureForEventiciousApi(body);
      const incompleteWarning = warnings.length > 0
        ? "Course payload looks incomplete. Eventicious course creation is known to fail with HTTP 500 when required skeleton fields are missing. Use full course skeleton with settings, deadline, finalMessage, taskContent and poll metadata."
        : undefined;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, preview: normalizedBody, warnings, ...(incompleteWarning ? { recommendation: incompleteWarning } : {}) }) }] };
      if (!confirm) return toolError("confirm=true required to import course structure");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/courses", body: normalizedBody, credentials, ...(requestContext ? { requestContext } : {}), ...(acceptLanguage ? { acceptLanguage } : {}) });
        return { content: [{ type: "text" as const, text: JSON.stringify({ ...res.data as object, warnings }) }] };
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
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/courses/${params.courseId}/finalize`, body: {}, credentials, ...(requestContext ? { requestContext } : {}), ...(acceptLanguage ? { acceptLanguage } : {}) });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { success: true }) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_upload_course_images",
    "Upload course cover images. Returns fileId and thumbnailFileId. Accepts: imageUrl (public URL), fileBase64 (base64 string), dataUri (data:image/...), filePaths (local, server-accessible only), or existing coverImageFileId+coverImageThumbnailFileId (skip upload). Exactly one mode required. Remote MCP cannot use local file paths.",
    courseImageUploadSchema,
    async (params) => {
      const hasFilePaths = params.filePaths && params.filePaths.length > 0;
      const hasImageUrl = !!params.imageUrl;
      const hasFileBase64 = !!params.fileBase64;
      const hasDataUri = !!params.dataUri;
      const hasExistingIds = params.coverImageFileId != null && params.coverImageThumbnailFileId != null;

      const modesProvided = [hasFilePaths, hasImageUrl, hasFileBase64 || hasDataUri, hasExistingIds].filter(Boolean).length;
      if (modesProvided === 0) {
        return toolError("Provide exactly one input mode: imageUrl, fileBase64/dataUri, filePaths, or existing coverImageFileId+coverImageThumbnailFileId.");
      }
      if (modesProvided > 1) {
        return toolError("Provide exactly one input mode. Multiple modes detected: imageUrl, fileBase64/dataUri, filePaths, coverImageFileId+coverImageThumbnailFileId. Use only one.");
      }

      logger.info("tool_call", { tool: "eventicious_upload_course_images", dry_run: params.dry_run, mode: hasExistingIds ? "existingIds" : hasImageUrl ? "imageUrl" : hasFileBase64 || hasDataUri ? "base64" : "filePaths" });

      if (hasExistingIds) {
        if (params.dry_run) {
          return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, preview: { coverImageFileId: params.coverImageFileId, coverImageThumbnailFileId: params.coverImageThumbnailFileId, note: "Using existing image IDs. No upload needed." } }) }] };
        }
        return { content: [{ type: "text" as const, text: JSON.stringify({ success: true, coverImageFileId: params.coverImageFileId, coverImageThumbnailFileId: params.coverImageThumbnailFileId, note: "Existing image IDs accepted. No upload performed." }) }] };
      }

      if (params.dry_run) {
        const previewDetail = hasImageUrl
          ? { imageUrl: params.imageUrl, note: "Real upload downloads image from URL and uploads to POST /api/external/v2/images/upload?generateThumbnails=true" }
          : hasFileBase64 || hasDataUri
          ? { note: "Real upload decodes base64/dataUri and uploads to POST /api/external/v2/images/upload?generateThumbnails=true" }
          : { filePaths: params.filePaths, note: "Real upload reads local files and sends multipart/form-data to POST /api/external/v2/images/upload?generateThumbnails=true. WARNING: Local file paths only work if files are accessible to the server." };
        return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, preview: previewDetail }) }] };
      }

      if (!params.confirm) return toolError("confirm=true required to upload images");

      try {
        const ALLOWED_TYPES = ["image/jpeg", "image/png"];
        const MAX_SIZE = 10 * 1024 * 1024;

        async function uploadImagesToEventicious(sources: { blob: Blob; name: string }[]) {
          const formData = new FormData();
          for (const s of sources) {
            formData.append("file", s.blob, s.name);
          }
          const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/images/upload?generateThumbnails=true", body: formData, credentials, isMultipart: true, ...(requestContext ? { requestContext } : {}), ...(acceptLanguage ? { acceptLanguage } : {}) });
          return res.data;
        }

        if (hasImageUrl) {
          const imgRes = await fetch(params.imageUrl!);
          if (!imgRes.ok) return toolError(`Failed to download image from URL: ${imgRes.status} ${imgRes.statusText}`);
          const contentType = imgRes.headers.get("content-type") || "";
          if (!ALLOWED_TYPES.some(t => contentType.includes(t))) {
            return toolError(`Unsupported image type: ${contentType || "unknown"}. Only image/jpeg and image/png are supported. URL must point directly to an image file.`);
          }
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          if (buffer.length > MAX_SIZE) return toolError(`Image too large: ${buffer.length} bytes. Maximum is ${MAX_SIZE} bytes (10 MB).`);
          const fileName = contentType.includes("png") ? "cover.png" : "cover.jpg";
          const data = await uploadImagesToEventicious([{ blob: new Blob([buffer], { type: contentType }), name: fileName }]);
          return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
        }

        if (hasFileBase64) {
          const mime = params.mimeType || "image/jpeg";
          if (!ALLOWED_TYPES.includes(mime)) return toolError(`Unsupported mimeType: ${mime}. Only image/jpeg and image/png are supported.`);
          const buffer = Buffer.from(params.fileBase64!, "base64");
          if (buffer.length > MAX_SIZE) return toolError(`Image too large: ${buffer.length} bytes. Maximum is ${MAX_SIZE} bytes (10 MB).`);
          const fileName = mime === "image/png" ? (params.fileName || "cover.png") : (params.fileName || "cover.jpg");
          const data = await uploadImagesToEventicious([{ blob: new Blob([buffer], { type: mime }), name: fileName }]);
          return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
        }

        if (hasDataUri) {
          const match = params.dataUri!.match(/^data:(image\/[a-z]+);base64,(.+)$/);
          if (!match) return toolError("Invalid dataUri format. Expected: data:image/jpeg;base64,... or data:image/png;base64,...");
          const mime = match[1] as string;
          if (!ALLOWED_TYPES.includes(mime)) return toolError(`Unsupported image type in dataUri: ${mime}. Only image/jpeg and image/png are supported.`);
          const buffer = Buffer.from(match[2], "base64");
          if (buffer.length > MAX_SIZE) return toolError(`Image too large: ${buffer.length} bytes. Maximum is ${MAX_SIZE} bytes (10 MB).`);
          const fileName = mime === "image/png" ? "cover.png" : "cover.jpg";
          const data = await uploadImagesToEventicious([{ blob: new Blob([buffer], { type: mime }), name: fileName }]);
          return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
        }

        if (hasFilePaths) {
          const sources: { blob: Blob; name: string }[] = [];
          for (const fp of params.filePaths!) {
            try {
              const fs = await import("fs");
              const path = await import("path");
              const buffer = fs.readFileSync(fp);
              const ext = path.extname(fp).toLowerCase();
              const mime = ext === ".png" ? "image/png" : "image/jpeg";
              sources.push({ blob: new Blob([buffer], { type: mime }), name: path.basename(fp) });
            } catch (fsErr: unknown) {
              const err = fsErr as { code?: string; message?: string };
              if (err.code === "ENOENT") {
                return toolError(`The remote MCP server cannot access local file path: ${fp}. Use imageUrl (public URL), fileBase64 (base64 string), dataUri (data:image/...), or provide existing coverImageFileId+coverImageThumbnailFileId.`);
              }
              return toolError(`Failed to read file ${fp}: ${err.message || String(fsErr)}`);
            }
          }
          const data = await uploadImagesToEventicious(sources);
          return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
        }

        return toolError("No image source provided.");
      } catch (err) { return toolError(String(err)); }
    }
  );
}
