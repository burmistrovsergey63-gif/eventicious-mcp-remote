import { z } from "zod";

export const sessionInputSchema = z.object({
  id: z.number().describe("Session ID in your external system"),
  title: z.string().describe("Session title"),
  description: z.string().optional().describe("Session description (HTML supported)"),
  startTime: z.string().describe("Start time ISO 8601 e.g. 2026-09-01T10:00"),
  endTime: z.string().describe("End time ISO 8601"),
  tagIds: z.array(z.number()).optional().describe("Array of tag IDs"),
  speakersIds: z.array(z.number()).optional().describe("Array of speaker (user) IDs"),
  locationsIds: z.array(z.number()).optional().describe("Array of location IDs"),
  aclGroupsIds: z.array(z.number()).optional().describe("Array of ACL group IDs for visibility"),
  type: z.number().optional().describe("0=speech, 1=coffee-break, 2=filler"),
  color: z.string().optional().describe("Hex color"),
  externalImagePath: z.string().optional().describe("URL to session image"),
});

export const sessionUpdateSchema = z.object({
  id: z.number().describe("Session ID in your external system"),
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
});

export const sessionDeleteSchema = z.object({
  id: z.number().describe("Session ID in your external system"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_SESSIONS").optional().describe("Exact string required for real deletion"),
});

export const sessionIdSchema = z.object({
  sessionId: z.number().describe("Session ID in your external system"),
});
