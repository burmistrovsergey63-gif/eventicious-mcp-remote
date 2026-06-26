import { z } from "zod";

export const attachmentInputSchema = z.object({
  id: z.number().describe("Attachment ID in your external system"),
  sessionId: z.number().describe("Session ID this attachment belongs to"),
  title: z.string().describe("Attachment title"),
  url: z.string().describe("Attachment URL"),
});

export const attachmentUpdateSchema = z.object({
  sessionId: z.number().describe("Session ID"),
  attachmentId: z.number().describe("Attachment ID in your external system"),
  title: z.string().optional(),
  url: z.string().optional(),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
});

export const attachmentDeleteSchema = z.object({
  sessionId: z.number().describe("Session ID"),
  attachmentId: z.number().describe("Attachment ID in your external system"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_SESSION_ATTACHMENTS").describe("Exact string required"),
});
