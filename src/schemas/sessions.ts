import { z } from "zod";

// Raw shape for MCP SDK - source of truth
export const createSessionShape = {
  id: z.number().describe("Session ID in your external system"),
  title: z.string().describe("Session title"),
  description: z.string().optional().describe("HTML supported"),
  startTime: z.string().describe("ISO 8601 e.g. 2026-09-01T10:00"),
  endTime: z.string().describe("ISO 8601"),
  tagIds: z.array(z.number()).optional().describe("Array of tag IDs"),
  speakersIds: z.array(z.number()).optional().describe("Array of speaker (user) IDs — docs use speakersIds"),
  locationsIds: z.array(z.number()).optional().describe("Array of location IDs — docs use locationsIds"),
  aclGroupsIds: z.array(z.number()).optional().describe("Array of ACL group IDs for visibility"),
  type: z.number().optional().describe("0=speech, 1=coffee-break, 2=filler"),
  color: z.string().optional().describe("Hex color"),
  externalImagePath: z.string().optional().describe("URL to session image"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const updateSessionShape = {
  id: z.number().describe("Session ID"),
  title: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  tagIds: z.array(z.number()).optional(),
  speakersIds: z.array(z.number()).optional(),
  locationsIds: z.array(z.number()).optional(),
  aclGroupsIds: z.array(z.number()).optional(),
  type: z.number().optional(),
  color: z.string().optional(),
  externalImagePath: z.string().optional(),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const deleteSessionShape = {
  id: z.number().describe("Session ID"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_SESSIONS").optional().describe("Exact string required for real deletion"),
};

// Full ZodObject schemas for tests/documentation (built from shapes)
export const sessionCreateSchema = z.object(createSessionShape);

export const sessionUpdateSchema = z.object(updateSessionShape);

export const sessionDeleteSchema = z.object(deleteSessionShape);

export const sessionIdSchema = z.object({
  sessionId: z.number().describe("Session ID in your external system"),
});