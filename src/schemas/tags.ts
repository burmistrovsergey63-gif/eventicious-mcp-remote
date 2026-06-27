import { z } from "zod";

export const tagInputSchema = z.object({
  id: z.number().describe("Tag ID in your external system"),
  name: z.string().describe("Tag name"),
  color: z.string().optional().describe("Hex color string e.g. #ABCDEF"),
  visibilityFlag: z.number().optional().describe("0=hidden in schedule grid, 1=visible on session card"),
});

export const tagUpdateSchema = z.object({
  id: z.number().describe("Tag ID in your external system"),
  name: z.string().describe("New tag name"),
  color: z.string().optional(),
  visibilityFlag: z.number().optional(),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
});

export const tagDeleteSchema = z.object({
  id: z.number().describe("Tag ID in your external system"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_TAGS").optional().describe("Exact string required for real deletion"),
});
