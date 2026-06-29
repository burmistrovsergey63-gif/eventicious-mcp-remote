import { z } from "zod";

// Raw shape for MCP SDK - source of truth
export const createTagShape = {
  id: z.number().describe("Tag ID in your external system"),
  name: z.string().describe("Tag name"),
  color: z.string().optional().describe("Hex color e.g. #ABCDEF"),
  visibilityFlag: z.number().optional().describe("0=hidden in schedule grid, 1=visible on session card"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const updateTagShape = {
  id: z.number().describe("Tag ID"),
  name: z.string().describe("New tag name"),
  color: z.string().optional(),
  visibilityFlag: z.number().optional(),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const deleteTagShape = {
  id: z.number().describe("Tag ID"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_TAGS").optional().describe("Exact string required for real deletion"),
};

// Full ZodObject schemas for tests/documentation (built from shapes)
export const tagInputSchema = z.object({
  id: z.number().describe("Tag ID in your external system"),
  name: z.string().describe("Tag name"),
  color: z.string().optional().describe("Hex color string e.g. #ABCDEF"),
  visibilityFlag: z.number().optional().describe("0=hidden in schedule grid, 1=visible on session card"),
});

export const tagCreateSchema = z.object(createTagShape);

export const tagUpdateSchema = z.object(updateTagShape);

export const tagDeleteSchema = z.object(deleteTagShape);