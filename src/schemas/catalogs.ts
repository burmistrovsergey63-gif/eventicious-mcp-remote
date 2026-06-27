import { z } from "zod";

export const catalogCreateSchema = {
  name: z.string().describe("Catalog name"),
  description: z.string().optional().describe("Catalog description (plain text or HTML)"),
  isHtmlText: z.boolean().optional().describe("Whether description contains HTML tags"),
  externalId: z.string().optional().describe("External identifier for your system"),
  order: z.number().int().optional().describe("Display order in catalog list"),
  coverImageUrl: z.string().url().optional().describe("Cover image URL (auto-cropped)"),
  viewOptions: z.enum(["imageOnly", "textOnly", "textAndImage"]).optional().describe("Display mode"),
  textLogoImageUrl: z.string().url().optional().describe("Logo for textAndImage mode"),
  fullLogoImageUrl: z.string().url().optional().describe("Logo for imageOnly mode"),
  aclGroupsExternalIds: z.array(z.number().int()).optional().describe("ACL group IDs that can access this catalog"),
  dry_run: z.boolean().default(true).describe("Preview only, do not execute"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const catalogUpdateSchema = {
  catalogId: z.number().int().describe("Catalog ID to update"),
  name: z.string().optional().describe("Catalog name"),
  description: z.string().optional().describe("Catalog description"),
  isHtmlText: z.boolean().optional().describe("Whether description contains HTML tags"),
  externalId: z.string().optional().describe("External identifier"),
  order: z.number().int().optional().describe("Display order"),
  coverImageUrl: z.string().optional().describe("Cover image URL"),
  viewOptions: z.enum(["imageOnly", "textOnly", "textAndImage"]).optional().describe("Display mode"),
  textLogoImageUrl: z.string().optional().describe("Logo for textAndImage mode"),
  fullLogoImageUrl: z.string().optional().describe("Logo for imageOnly mode"),
  aclGroupsExternalIds: z.array(z.number().int()).optional().describe("ACL group IDs"),
  dry_run: z.boolean().default(true).describe("Preview only, do not execute"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const catalogDeleteSchema = {
  catalogId: z.number().int().describe("Catalog ID to delete"),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_CATALOG").optional().describe("Exact string required for real deletion"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};
