import { z } from "zod";

// --- Folders ---
export const folderCreateSchema = {
  catalogId: z.number().int().describe("Parent catalog ID"),
  name: z.string().describe("Folder name"),
  description: z.string().describe("Folder description (plain text or HTML) — required by Eventicious API"),
  isHtmlText: z.boolean().optional().describe("Whether description contains HTML tags"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  coverImageUrl: z.string().url().optional().describe("Cover image URL"),
  viewOptions: z.enum(["imageOnly", "textOnly", "textAndImage"]).describe("Display mode (required by API). textAndImage also requires textLogoImageUrl; imageOnly requires fullLogoImageUrl."),
  textLogoImageUrl: z.string().url().optional().describe("Logo for textAndImage mode"),
  fullLogoImageUrl: z.string().url().optional().describe("Logo for imageOnly mode"),
  aclGroupsExternalIds: z.array(z.number().int()).optional().describe("ACL group IDs that can access this folder. Groups must exist before use."),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const folderUpdateSchema = {
  catalogId: z.number().int().describe("Parent catalog ID"),
  folderId: z.number().int().describe("Folder ID to update"),
  name: z.string().optional().describe("Folder name"),
  description: z.string().optional().describe("Folder description"),
  isHtmlText: z.boolean().optional().describe("Whether description contains HTML tags"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  coverImageUrl: z.string().optional().describe("Cover image URL"),
  viewOptions: z.enum(["imageOnly", "textOnly", "textAndImage"]).optional().describe("Display mode"),
  textLogoImageUrl: z.string().optional().describe("Logo for textAndImage mode"),
  fullLogoImageUrl: z.string().optional().describe("Logo for imageOnly mode"),
  aclGroupsExternalIds: z.array(z.number().int()).optional().describe("ACL group IDs. Pass empty array to remove all group restrictions."),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const folderDeleteSchema = {
  catalogId: z.number().int().describe("Parent catalog ID"),
  folderId: z.number().int().describe("Folder ID to delete"),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_CATALOG_FOLDER").optional().describe("Exact string required for real deletion"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Files ---
export const fileAddToCatalogSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  fileId: z.number().int().describe("File ID from upload"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const fileDeleteFromCatalogSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  catalogElementId: z.number().int().describe("Catalog element ID to delete"),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_CATALOG_CONTENT").optional().describe("Exact string required for real deletion"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Links ---
export const linkCreateSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  name: z.string().describe("Link name"),
  url: z.string().url().describe("Link URL"),
  viewOptions: z.enum(["imageOnly", "textOnly", "textAndImage"]).describe("Display mode"),
  textLogoImageUrl: z.string().url().optional().describe("Logo for textAndImage mode"),
  fullLogoImageUrl: z.string().url().optional().describe("Logo for imageOnly mode"),
  openInWebController: z.boolean().optional().describe("Set true if external service requires auth"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const linkDeleteSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  catalogElementId: z.number().int().describe("Link element ID to delete"),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_CATALOG_CONTENT").optional().describe("Exact string required for real deletion"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Text 2.0 / GravityJson ---
export const text2CreateSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  text: z.union([z.string(), z.record(z.unknown())]).describe("GravityJson as string or object. Strings are auto-converted: JSON objects are validated, markdown/plain text is converted to GravityJson."),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const text2DeleteSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  catalogElementId: z.number().int().describe("Text 2.0 element ID to delete"),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_CATALOG_CONTENT").optional().describe("Exact string required for real deletion"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Videos ---
export const videoAddToCatalogSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  videoId: z.number().int().describe("Video ID from upload"),
  name: z.string().optional().describe("Video display name"),
  fullLogoImageUrl: z.string().url().optional().describe("Thumbnail image URL"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const videoDeleteFromCatalogSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  catalogElementId: z.number().int().describe("Video element ID to delete"),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_CATALOG_CONTENT").optional().describe("Exact string required for real deletion"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Groups ---
export const catalogGroupAddSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  groups: z.array(z.object({
    externalId: z.number().int().describe("Group external ID"),
    order: z.number().int().optional().describe("Display order"),
  })).describe("Groups to add"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const catalogGroupDeleteSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  catalogElementId: z.number().int().describe("Group element ID to delete"),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_CATALOG_GROUP").optional().describe("Exact string required for real deletion"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Order ---
export const catalogOrderSchema = {
  catalogIds: z.array(z.number().int()).describe("All root catalog IDs in desired order"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const catalogElementOrderSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  orderedItems: z.array(z.object({
    id: z.number().int().describe("Element ID"),
    type: z.string().describe("Element type (Catalog, Text, Link, File, Group, Attendee, etc.)"),
  })).describe("All elements in desired order"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Bulk Delete ---
export const catalogBulkDeleteSchema = {
  catalogId: z.number().int().describe("Catalog ID"),
  subcatalogIds: z.array(z.number().int()).optional().describe("Folder IDs to delete"),
  elementIds: z.array(z.number().int()).optional().describe("Element IDs to delete"),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_CATALOG_ITEMS_BULK").optional().describe("Exact string required for real deletion"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Menu ---
export const catalogMenuAddSchema = {
  catalogId: z.number().int().describe("Catalog or folder ID to add to menu"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const catalogMenuDeleteSchema = {
  catalogId: z.number().int().describe("Catalog or folder ID to remove from menu"),
  danger_confirm: z.literal("CHANGE_EVENTICIOUS_CATALOG_ORDER").optional().describe("Exact string required for real deletion"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};
