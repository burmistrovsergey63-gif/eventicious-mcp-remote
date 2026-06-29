import { z } from "zod";

// Raw shape for MCP SDK - source of truth
export const createLocationShape = {
  id: z.number().describe("Location ID in your external system"),
  name: z.string().describe("Location name"),
  position: z.number().describe("Unique position number for display order"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const updateLocationShape = {
  id: z.number().describe("Location ID"),
  name: z.string().describe("New location name"),
  position: z.number().describe("Position number"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const deleteLocationShape = {
  id: z.number().describe("Location ID"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_LOCATIONS").optional().describe("Exact string required for real deletion"),
};

// Full ZodObject schemas for tests/documentation (built from shapes)
export const locationCreateSchema = z.object({
  id: z.number().describe("Location ID in your external system"),
  name: z.string().describe("Location name"),
  position: z.number().describe("Unique position number for display order"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
});

export const locationUpdateSchema = z.object({
  id: z.number().describe("Location ID in your external system"),
  name: z.string().describe("New location name"),
  position: z.number().describe("Position number"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
});

export const locationDeleteSchema = z.object({
  id: z.number().describe("Location ID in your external system"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_LOCATIONS").optional().describe("Exact string required for real deletion"),
});