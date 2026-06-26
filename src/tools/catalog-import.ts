import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logger } from "../logger";
import { convertMarkdownToGravityJson, validateGravityJson } from "./gravity-json";

const text2ItemSchema = z.object({
  title: z.string().optional().describe("Text element name (optional)"),
  markdown: z.string().optional().describe("Markdown/plain text content (converted to GravityJson)"),
  plainText: z.string().optional().describe("Plain text content (converted to GravityJson)"),
  gravityJson: z.record(z.unknown()).optional().describe("Pre-built GravityJson object"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  parentFolderRef: z.string().optional().describe("Reference to parent folder by name or externalId"),
});

const folderItemSchema = z.object({
  name: z.string().describe("Folder name"),
  description: z.string().optional().describe("Folder description"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  aclGroupsExternalIds: z.array(z.number().int()).optional().describe("ACL group IDs"),
  viewOptions: z.enum(["imageOnly", "textOnly", "textAndImage"]).optional().describe("Display mode"),
});

const linkItemSchema = z.object({
  name: z.string().describe("Link name"),
  url: z.string().url().describe("Link URL"),
  viewOptions: z.enum(["imageOnly", "textOnly", "textAndImage"]).describe("Display mode"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  parentFolderRef: z.string().optional().describe("Reference to parent folder"),
});

const fileItemSchema = z.object({
  fileId: z.number().int().describe("File ID from upload"),
  name: z.string().optional().describe("File display name"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  parentFolderRef: z.string().optional().describe("Reference to parent folder"),
});

const videoItemSchema = z.object({
  videoId: z.number().int().describe("Video ID from upload"),
  name: z.string().optional().describe("Video display name"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  parentFolderRef: z.string().optional().describe("Reference to parent folder"),
});

const prepareSchema = {
  catalog: z.object({
    name: z.string().describe("Catalog name"),
    description: z.string().optional().describe("Catalog description"),
    externalId: z.string().optional().describe("External identifier"),
    aclGroupsExternalIds: z.array(z.number().int()).optional().describe("ACL group IDs"),
  }).describe("Root catalog definition"),
  folders: z.array(folderItemSchema).optional().describe("Folders to create"),
  files: z.array(fileItemSchema).optional().describe("Files to add"),
  links: z.array(linkItemSchema).optional().describe("Links to create"),
  text2: z.array(text2ItemSchema).optional().describe("Text 2.0 elements (GravityJson or markdown). Legacy texts[] is NOT supported."),
  videos: z.array(videoItemSchema).optional().describe("Videos to add"),
};

const validateSchema = {
  plan: z.record(z.unknown()).describe("Plan object from eventicious_prepare_catalog_import"),
};

function buildGravityJsonFromItem(item: { markdown?: string; plainText?: string; gravityJson?: Record<string, unknown> }): {
  gravityJson: Record<string, unknown>;
  warnings: string[];
  errors: string[];
} {
  if (item.gravityJson) {
    const validation = validateGravityJson(item.gravityJson);
    return { gravityJson: item.gravityJson, warnings: validation.warnings, errors: validation.errors };
  }

  const text = item.markdown ?? item.plainText ?? "";
  if (!text) {
    return {
      gravityJson: { type: "doc", content: [] },
      warnings: ["No text content provided"],
      errors: [],
    };
  }

  const conversion = convertMarkdownToGravityJson(text);
  return { gravityJson: conversion.result, warnings: conversion.warnings, errors: conversion.errors };
}

export function registerCatalogImportTools(
  server: McpServer,
  toolError: (msg: string) => { content: { type: "text"; text: string }[]; isError: true }
) {
  server.tool(
    "eventicious_prepare_catalog_import",
    "Prepare a catalog import plan from a JSON/tree structure. Normalizes the tree, builds an execution plan. Never performs API calls. Use text2[] for text content (legacy texts[] is NOT supported).",
    prepareSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_prepare_catalog_import" });

      const warnings: string[] = [];
      const errors: string[] = [];

      const catalogsToCreate: unknown[] = [];
      const foldersToCreate: unknown[] = [];
      const filesToCreate: unknown[] = [];
      const linksToCreate: unknown[] = [];
      const text2ToCreate: unknown[] = [];
      const videosToCreate: unknown[] = [];

      catalogsToCreate.push({
        name: params.catalog.name,
        description: params.catalog.description,
        externalId: params.catalog.externalId,
        aclGroupsExternalIds: params.catalog.aclGroupsExternalIds,
      });

      if (params.folders) {
        for (const folder of params.folders) {
          foldersToCreate.push({
            name: folder.name,
            description: folder.description,
            externalId: folder.externalId,
            order: folder.order,
            aclGroupsExternalIds: folder.aclGroupsExternalIds,
            viewOptions: folder.viewOptions,
          });
        }
      }

      if (params.files) {
        for (const file of params.files) {
          filesToCreate.push({
            fileId: file.fileId,
            externalId: file.externalId,
            order: file.order,
            parentFolderRef: file.parentFolderRef,
          });
        }
      }

      if (params.links) {
        for (const link of params.links) {
          linksToCreate.push({
            name: link.name,
            url: link.url,
            viewOptions: link.viewOptions,
            externalId: link.externalId,
            order: link.order,
            parentFolderRef: link.parentFolderRef,
          });
        }
      }

      if (params.text2) {
        for (const item of params.text2) {
          const conversion = buildGravityJsonFromItem(item);
          warnings.push(...conversion.warnings.map(w => `text2[${item.title ?? "untitled"}]: ${w}`));
          errors.push(...conversion.errors.map(e => `text2[${item.title ?? "untitled"}]: ${e}`));
          text2ToCreate.push({
            title: item.title,
            gravityJson: conversion.gravityJson,
            externalId: item.externalId,
            order: item.order,
            parentFolderRef: item.parentFolderRef,
          });
        }
      }

      if (params.videos) {
        for (const video of params.videos) {
          videosToCreate.push({
            videoId: video.videoId,
            name: video.name,
            externalId: video.externalId,
            order: video.order,
            parentFolderRef: video.parentFolderRef,
          });
        }
      }

      const orderPlan = [
        ...foldersToCreate.map((f: any) => ({ type: "folder", name: f.name })),
        ...filesToCreate.map((f: any) => ({ type: "file", fileId: f.fileId })),
        ...linksToCreate.map((l: any) => ({ type: "link", name: l.name })),
        ...text2ToCreate.map((t: any) => ({ type: "text2", title: t.title })),
        ...videosToCreate.map((v: any) => ({ type: "video", name: v.name })),
      ];

      const recommendedExecutionOrder = [
        "1. Create root catalog",
        "2. Create folders",
        "3. Upload/create files",
        "4. Create links",
        "5. Create Text 2.0 / GravityJson elements",
        "6. Create videos",
        "7. Update order/menu",
        "8. Verify structure",
      ];

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            normalizedTree: params,
            catalogsToCreate,
            foldersToCreate,
            filesToCreate,
            linksToCreate,
            text2ToCreate,
            videosToCreate,
            orderPlan,
            warnings,
            errors,
            recommendedExecutionOrder,
          }),
        }],
      };
    }
  );

  server.tool(
    "eventicious_validate_catalog_plan",
    "Validate a catalog import plan from eventicious_prepare_catalog_import. Checks required fields, duplicate externalIds, folder references, link URLs, GravityJson shapes, and more. Never performs API calls.",
    validateSchema,
    async (params) => {
      logger.info("tool_call", { tool: "eventicious_validate_catalog_plan" });

      const plan = params.plan as Record<string, unknown>;
      const errors: string[] = [];
      const warnings: string[] = [];

      const externalIds = new Set<string>();
      const folderRefs = new Set<string>();
      const siblingOrders = new Map<string, Set<number>>();

      if (!plan.catalogsToCreate || !Array.isArray(plan.catalogsToCreate) || plan.catalogsToCreate.length === 0) {
        errors.push("Plan must include at least one catalog to create");
      }

      if (Array.isArray(plan.foldersToCreate)) {
        for (const folder of plan.foldersToCreate as Record<string, unknown>[]) {
          if (!folder.name) errors.push("Folder missing required field: name");
          if (folder.externalId) {
            if (externalIds.has(String(folder.externalId))) {
              errors.push(`Duplicate externalId: ${folder.externalId}`);
            }
            externalIds.add(String(folder.externalId));
            folderRefs.add(String(folder.externalId));
          }
          if (folder.name) folderRefs.add(String(folder.name));
        }
      }

      if (Array.isArray(plan.filesToCreate)) {
        for (const file of plan.filesToCreate as Record<string, unknown>[]) {
          if (!file.fileId) errors.push("File missing required field: fileId");
          if (file.externalId) {
            if (externalIds.has(String(file.externalId))) errors.push(`Duplicate externalId: ${file.externalId}`);
            externalIds.add(String(file.externalId));
          }
          if (file.parentFolderRef && !folderRefs.has(String(file.parentFolderRef))) {
            warnings.push(`File references unknown folder: ${file.parentFolderRef}`);
          }
        }
      }

      if (Array.isArray(plan.linksToCreate)) {
        for (const link of plan.linksToCreate as Record<string, unknown>[]) {
          if (!link.name) errors.push("Link missing required field: name");
          if (!link.url) errors.push("Link missing required field: url");
          if (link.externalId) {
            if (externalIds.has(String(link.externalId))) errors.push(`Duplicate externalId: ${link.externalId}`);
            externalIds.add(String(link.externalId));
          }
          if (link.parentFolderRef && !folderRefs.has(String(link.parentFolderRef))) {
            warnings.push(`Link references unknown folder: ${link.parentFolderRef}`);
          }
        }
      }

      if (Array.isArray(plan.text2ToCreate)) {
        for (const text2 of plan.text2ToCreate as Record<string, unknown>[]) {
          if (!text2.gravityJson) {
            errors.push(`Text2 missing gravityJson: ${text2.title ?? "untitled"}`);
          } else {
            const validation = validateGravityJson(text2.gravityJson);
            if (!validation.valid) {
              errors.push(`Text2 invalid GravityJson [${text2.title ?? "untitled"}]: ${validation.errors.join("; ")}`);
            }
            warnings.push(...validation.warnings.map(w => `Text2 [${text2.title ?? "untitled"}]: ${w}`));
          }
          if (text2.externalId) {
            if (externalIds.has(String(text2.externalId))) errors.push(`Duplicate externalId: ${text2.externalId}`);
            externalIds.add(String(text2.externalId));
          }
          if (text2.parentFolderRef && !folderRefs.has(String(text2.parentFolderRef))) {
            warnings.push(`Text2 references unknown folder: ${text2.parentFolderRef}`);
          }
        }
      }

      if (Array.isArray(plan.videosToCreate)) {
        for (const video of plan.videosToCreate as Record<string, unknown>[]) {
          if (!video.videoId) errors.push("Video missing required field: videoId");
          if (video.externalId) {
            if (externalIds.has(String(video.externalId))) errors.push(`Duplicate externalId: ${video.externalId}`);
            externalIds.add(String(video.externalId));
          }
          if (video.parentFolderRef && !folderRefs.has(String(video.parentFolderRef))) {
            warnings.push(`Video references unknown folder: ${video.parentFolderRef}`);
          }
        }
      }

      if (plan.texts && Array.isArray(plan.texts) && (plan.texts as unknown[]).length > 0) {
        errors.push("Legacy texts[] is NOT supported. Use text2[] instead for Text 2.0 / GravityJson content.");
      }

      const summary = {
        catalogsCount: Array.isArray(plan.catalogsToCreate) ? plan.catalogsToCreate.length : 0,
        foldersCount: Array.isArray(plan.foldersToCreate) ? plan.foldersToCreate.length : 0,
        filesCount: Array.isArray(plan.filesToCreate) ? plan.filesToCreate.length : 0,
        linksCount: Array.isArray(plan.linksToCreate) ? plan.linksToCreate.length : 0,
        text2Count: Array.isArray(plan.text2ToCreate) ? plan.text2ToCreate.length : 0,
        videosCount: Array.isArray(plan.videosToCreate) ? plan.videosToCreate.length : 0,
        orderOperationsCount: Array.isArray(plan.orderPlan) ? plan.orderPlan.length : 0,
      };

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            valid: errors.length === 0,
            errors,
            warnings,
            summary,
          }),
        }],
      };
    }
  );
}
