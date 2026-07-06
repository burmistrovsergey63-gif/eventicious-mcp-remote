import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventiciousRequest, EventiciousCredentials } from "../eventicious-client";
import { logger } from "../logger";
import {
  folderCreateSchema,
  folderUpdateSchema,
  folderDeleteSchema,
  fileAddToCatalogSchema,
  fileDeleteFromCatalogSchema,
  linkCreateSchema,
  linkDeleteSchema,
  text2CreateSchema,
  text2DeleteSchema,
  videoAddToCatalogSchema,
  videoDeleteFromCatalogSchema,
  catalogGroupAddSchema,
  catalogGroupDeleteSchema,
  catalogOrderSchema,
  catalogElementOrderSchema,
  catalogBulkDeleteSchema,
  catalogMenuAddSchema,
  catalogMenuDeleteSchema,
} from "../schemas/catalog-elements";
import { convertMarkdownToGravityJson, validateGravityJson, buildInlineImagePlan } from "./gravity-json";
import { requireDangerConfirm } from "../utils/confirm";
import { processGravityJsonForInlineImages, InlineImageStorageOptions } from "../storage/inline-image-storage";

export function registerCatalogElementTools(
  server: McpServer,
  credentials: EventiciousCredentials,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true },
  requestScopedImgbbKey?: string
) {
  const envImgbbApiKey = process.env.IMGBB_API_KEY;
  const inlineImageStorageDriver = process.env.INLINE_IMAGE_STORAGE_DRIVER;
  const expirationSeconds = process.env.IMGBB_EXPIRATION_SECONDS
    ? parseInt(process.env.IMGBB_EXPIRATION_SECONDS, 10)
    : undefined;

  function resolveStorageOptions(): InlineImageStorageOptions | null {
    const apiKey = requestScopedImgbbKey || envImgbbApiKey;
    if (inlineImageStorageDriver === "imgbb" && apiKey) {
      return { apiKey, expirationSeconds };
    }
    return null;
  }

  const MISSING_INLINE_IMAGE_KEY_ERROR =
    "Для картинки внутри текстового блока нужен публичный URL. " +
    "Загрузите изображение в любое публичное хранилище, например Google Drive, Яндекс Диск, ImgBB, GitHub Pages или CDN, " +
    "и передайте ссылку как imageUrl.";

  const FILE_ID_INLINE_ERROR =
    "fileId подходит для обложки курса, но не для картинки внутри текста. " +
    "Для Text 2.0 нужен публичный URL изображения.";

  // --- Folders ---
  server.tool(
    "eventicious_create_folder",
    "Create a folder (sub-catalog) inside a catalog. Supports aclGroupsExternalIds for folder-level visibility. For Russian text use UTF-8.",
    folderCreateSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_create_folder", catalogId: params.catalogId, dry_run: params.dry_run });
      const { dry_run, confirm, catalogId, ...body } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId, preview: body }) }] };
      if (!confirm) return toolError("confirm=true required to create folder");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/catalogs/${catalogId}/elements/folders`, body, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_update_folder",
    "Update a folder in a catalog. Supports aclGroupsExternalIds for folder-level visibility. For Russian text use UTF-8.",
    folderUpdateSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_update_folder", catalogId: params.catalogId, folderId: params.folderId, dry_run: params.dry_run });
      const { dry_run, confirm, catalogId, folderId, ...body } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId, folderId, preview: body }) }] };
      if (!confirm) return toolError("confirm=true required to update folder");
      try {
        const res = await eventiciousRequest({ method: "PUT", endpoint: `/api/external/v2/catalogs/${catalogId}/elements/folders/${folderId}`, body, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_delete_folder",
    "Delete a folder from a catalog. Requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_FOLDER'.",
    folderDeleteSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_folder", catalogId: params.catalogId, folderId: params.folderId, dry_run: params.dry_run });
      if (params.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId: params.catalogId, folderId: params.folderId }) }] };
      if (!params.confirm) return toolError("confirm=true required to delete folder");
      if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_CATALOG_FOLDER")) return toolError("danger_confirm='DELETE_EVENTICIOUS_CATALOG_FOLDER' required");
      try {
        const res = await eventiciousRequest({ method: "DELETE", endpoint: `/api/external/v2/catalogs/${params.catalogId}/elements/folders/${params.folderId}`, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  // --- Files ---
  server.tool(
    "eventicious_add_file_to_catalog",
    "Add an uploaded file to a catalog.",
    fileAddToCatalogSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_add_file_to_catalog", catalogId: params.catalogId, dry_run: params.dry_run });
      const { dry_run, confirm, catalogId, ...body } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId, preview: body }) }] };
      if (!confirm) return toolError("confirm=true required to add file");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/catalogs/${catalogId}/elements/files`, body: { files: [body] }, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_delete_file_from_catalog",
    "Delete a file element from a catalog. Requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT'.",
    fileDeleteFromCatalogSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_file_from_catalog", catalogId: params.catalogId, dry_run: params.dry_run });
      if (params.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId: params.catalogId, catalogElementId: params.catalogElementId }) }] };
      if (!params.confirm) return toolError("confirm=true required to delete file");
      if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_CATALOG_CONTENT")) return toolError("danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT' required");
      try {
        const res = await eventiciousRequest({ method: "DELETE", endpoint: `/api/external/v2/catalogs/${params.catalogId}/elements/files/${params.catalogElementId}`, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  // --- Links ---
  server.tool(
    "eventicious_create_link",
    "Create a link element in a catalog. For Russian text use UTF-8.",
    linkCreateSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_create_link", catalogId: params.catalogId, dry_run: params.dry_run });
      const { dry_run, confirm, catalogId, ...body } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId, preview: body }) }] };
      if (!confirm) return toolError("confirm=true required to create link");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/catalogs/${catalogId}/elements/links`, body, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_delete_link",
    "Delete a link element from a catalog. Requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT'.",
    linkDeleteSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_link", catalogId: params.catalogId, dry_run: params.dry_run });
      if (params.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId: params.catalogId, catalogElementId: params.catalogElementId }) }] };
      if (!params.confirm) return toolError("confirm=true required to delete link");
      if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_CATALOG_CONTENT")) return toolError("danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT' required");
      try {
        const res = await eventiciousRequest({ method: "DELETE", endpoint: `/api/external/v2/catalogs/${params.catalogId}/elements/links/${params.catalogElementId}`, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  // --- Text 2.0 / GravityJson ---
  server.tool(
    "eventicious_create_text2",
    "Add a Text 2.0 (GravityJson/ProseMirror) element to a catalog. Accepts GravityJson object, JSON string, or markdown/plain text (auto-converted). Supports inline images via fileBase64/dataUri/imageUrl with ImgBB storage. For Russian text use UTF-8. In direct PowerShell 5.1 HTTP JSON calls do not pass JSON as -Body string; use UTF-8 bytes.",
    text2CreateSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_create_text2", catalogId: params.catalogId, dry_run: params.dry_run });

      let gravityJson: Record<string, unknown>;
      let gravityJsonString: string;
      const warnings: string[] = [];

      if (typeof params.text === "object" && params.text !== null && "type" in params.text) {
        gravityJson = params.text as Record<string, unknown>;
        const validation = validateGravityJson(gravityJson);
        if (!validation.valid) return toolError(`Invalid GravityJson: ${validation.errors.join("; ")}`);
        warnings.push(...validation.warnings);
        gravityJsonString = JSON.stringify(gravityJson);
      } else if (typeof params.text === "string") {
        const trimmed = params.text.trim();
        if (trimmed.startsWith("{")) {
          try {
            const parsed = JSON.parse(trimmed);
            const validation = validateGravityJson(parsed);
            if (!validation.valid) return toolError(`Invalid GravityJson: ${validation.errors.join("; ")}`);
            gravityJson = parsed;
            warnings.push(...validation.warnings);
            gravityJsonString = JSON.stringify(parsed);
          } catch {
            return toolError("text string looks like JSON but could not be parsed");
          }
        } else {
          const conversion = convertMarkdownToGravityJson(trimmed);
          gravityJson = conversion.result;
          warnings.push(...conversion.warnings);
          gravityJsonString = JSON.stringify(conversion.result);
        }
      } else {
        return toolError("text must be a GravityJson object, JSON string, or markdown/plain text");
      }

      const currentStorageOptions = resolveStorageOptions();

      const imagePlan = buildInlineImagePlan(gravityJson, {
        forceUpload: !!currentStorageOptions,
        expirationSeconds,
      });

      let processedGravityJson = gravityJson;
      let inlineImageUploads: Array<Record<string, unknown>> = [];

      if (imagePlan.length > 0 && currentStorageOptions) {
        if (params.dry_run) {
          for (const item of imagePlan) {
            warnings.push(`Will upload inline image: ${item.fileName} (${item.mimeType || "unknown"})`);
          }
          const placeholderJson = JSON.parse(JSON.stringify(gravityJson));
          processedGravityJson = placeholderJson;
        } else {
          try {
            const { result, uploads } = await processGravityJsonForInlineImages(
              gravityJson,
              currentStorageOptions,
              false
            );
            processedGravityJson = result;
            inlineImageUploads = uploads.map((u) => ({
              provider: u.provider,
              source: u.source,
              publicUrl: u.publicUrl,
              width: u.width,
              height: u.height,
              sizeBytes: u.sizeBytes,
            }));
          } catch (err) {
            return toolError(`Failed to process inline images: ${String(err)}`);
          }
        }
      } else if (imagePlan.length > 0 && !currentStorageOptions) {
        return toolError(MISSING_INLINE_IMAGE_KEY_ERROR);
      }

      gravityJsonString = JSON.stringify(processedGravityJson);

      const { dry_run, confirm, catalogId, text, ...rest } = params;
      const body = { text: gravityJsonString, ...rest };

      if (dry_run) {
        const previewGravityJson = processedGravityJson;
        const truncatedJson = gravityJsonString.length > 200
          ? gravityJsonString.slice(0, 200) + "...(truncated)"
          : gravityJsonString;
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              dry_run: true,
              catalogId,
              externalId: rest.externalId,
              order: rest.order,
              gravityJsonPreview: previewGravityJson,
              apiPayloadTextPreview: truncatedJson,
              inlineImagePlan: imagePlan,
              warnings,
            }),
          }],
        };
      }

      if (!confirm) return toolError("confirm=true required to create text2");

      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/catalogs/${catalogId}/elements/gravity-editor`, body, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify({ ...res.data as Record<string, unknown>, inlineImages: inlineImageUploads, warnings }) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_delete_text2",
    "Delete a Text 2.0 element from a catalog. Requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT'.",
    text2DeleteSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_text2", catalogId: params.catalogId, dry_run: params.dry_run });
      if (params.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId: params.catalogId, catalogElementId: params.catalogElementId }) }] };
      if (!params.confirm) return toolError("confirm=true required to delete text2");
      if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_CATALOG_CONTENT")) return toolError("danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT' required");
      try {
        const res = await eventiciousRequest({ method: "DELETE", endpoint: `/api/external/v2/catalogs/${params.catalogId}/elements/gravity-editor/${params.catalogElementId}`, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  // --- Videos ---
  server.tool(
    "eventicious_add_video_to_catalog",
    "Add an uploaded video to a catalog.",
    videoAddToCatalogSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_add_video_to_catalog", catalogId: params.catalogId, dry_run: params.dry_run });
      const { dry_run, confirm, catalogId, ...body } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId, preview: body }) }] };
      if (!confirm) return toolError("confirm=true required to add video");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/catalogs/${catalogId}/elements/videos`, body, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_delete_video_from_catalog",
    "Delete a video element from a catalog. Requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT'.",
    videoDeleteFromCatalogSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_video_from_catalog", catalogId: params.catalogId, dry_run: params.dry_run });
      if (params.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId: params.catalogId, catalogElementId: params.catalogElementId }) }] };
      if (!params.confirm) return toolError("confirm=true required to delete video");
      if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_CATALOG_CONTENT")) return toolError("danger_confirm='DELETE_EVENTICIOUS_CATALOG_CONTENT' required");
      try {
        const res = await eventiciousRequest({ method: "DELETE", endpoint: `/api/external/v2/catalogs/${params.catalogId}/elements/videos/${params.catalogElementId}`, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  // --- Groups ---
  server.tool(
    "eventicious_add_groups_to_catalog",
    "Add one or more ACL groups to a catalog.",
    catalogGroupAddSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_add_groups_to_catalog", catalogId: params.catalogId, dry_run: params.dry_run });
      const { dry_run, confirm, catalogId, ...body } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId, preview: body }) }] };
      if (!confirm) return toolError("confirm=true required to add groups");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/catalogs/${catalogId}/elements/groups`, body, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_delete_group_from_catalog",
    "Delete a group element from a catalog. Requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_GROUP'.",
    catalogGroupDeleteSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_group_from_catalog", catalogId: params.catalogId, dry_run: params.dry_run });
      if (params.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId: params.catalogId, catalogElementId: params.catalogElementId }) }] };
      if (!params.confirm) return toolError("confirm=true required to delete group");
      if (!requireDangerConfirm(params.danger_confirm, "DELETE_EVENTICIOUS_CATALOG_GROUP")) return toolError("danger_confirm='DELETE_EVENTICIOUS_CATALOG_GROUP' required");
      try {
        const res = await eventiciousRequest({ method: "DELETE", endpoint: `/api/external/v2/catalogs/${params.catalogId}/elements/groups/${params.catalogElementId}`, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  // --- Order ---
  server.tool(
    "eventicious_set_catalog_order",
    "Reorder root catalogs. Requires danger_confirm='CHANGE_EVENTICIOUS_CATALOG_ORDER'. All catalog IDs must be provided in desired order.",
    catalogOrderSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_set_catalog_order", dry_run: params.dry_run });
      const { dry_run, confirm, ...body } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, preview: body }) }] };
      if (!confirm) return toolError("confirm=true required to reorder catalogs");
      try {
        const res = await eventiciousRequest({ method: "PUT", endpoint: "/api/external/v2/catalogs/order", body, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { success: true }) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_set_catalog_element_order",
    "Reorder elements within a catalog. Requires danger_confirm='CHANGE_EVENTICIOUS_CATALOG_ORDER'. All element IDs must be provided in desired order.",
    catalogElementOrderSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_set_catalog_element_order", catalogId: params.catalogId, dry_run: params.dry_run });
      const { dry_run, confirm, catalogId, ...body } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId, preview: body }) }] };
      if (!confirm) return toolError("confirm=true required to reorder elements");
      try {
        const res = await eventiciousRequest({ method: "PUT", endpoint: `/api/external/v2/catalogs/${catalogId}/content/order`, body, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { success: true }) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  // --- Bulk Delete ---
  server.tool(
    "eventicious_bulk_delete_catalog_elements",
    "Bulk delete folders and elements from a catalog. Requires danger_confirm='DELETE_EVENTICIOUS_CATALOG_ITEMS_BULK'.",
    catalogBulkDeleteSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_bulk_delete_catalog_elements", catalogId: params.catalogId, dry_run: params.dry_run });
      const { dry_run, danger_confirm, catalogId, ...body } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId, preview: body }) }] };
      if (!requireDangerConfirm(danger_confirm, "DELETE_EVENTICIOUS_CATALOG_ITEMS_BULK")) return toolError("danger_confirm='DELETE_EVENTICIOUS_CATALOG_ITEMS_BULK' required");
      try {
        const res = await eventiciousRequest({ method: "PUT", endpoint: `/api/external/v2/catalogs/${catalogId}/content/deleteBulk`, body, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  // --- Menu ---
  server.tool(
    "eventicious_add_to_menu",
    "Add a catalog or folder to the event menu.",
    catalogMenuAddSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_add_to_menu", catalogId: params.catalogId, dry_run: params.dry_run });
      const { dry_run, confirm, catalogId } = params;
      if (dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId }) }] };
      if (!confirm) return toolError("confirm=true required to add to menu");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/catalogs/${catalogId}/menu/add`, body: {}, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { success: true }) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );

  server.tool(
    "eventicious_delete_from_menu",
    "Remove a catalog or folder from the event menu. Requires danger_confirm='CHANGE_EVENTICIOUS_CATALOG_ORDER'.",
    catalogMenuDeleteSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_delete_from_menu", catalogId: params.catalogId, dry_run: params.dry_run });
      if (params.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, catalogId: params.catalogId }) }] };
      if (!params.confirm) return toolError("confirm=true required to delete from menu");
      if (!requireDangerConfirm(params.danger_confirm, "CHANGE_EVENTICIOUS_CATALOG_ORDER")) return toolError("danger_confirm='CHANGE_EVENTICIOUS_CATALOG_ORDER' required");
      try {
        const res = await eventiciousRequest({ method: "POST", endpoint: `/api/external/v2/catalogs/${params.catalogId}/menu/delete`, body: {}, credentials });
        return { content: [{ type: "text" as const, text: JSON.stringify(res.data ?? { success: true }) }] };
      } catch (err) { return toolError(String(err)); }
    }
  );
}
