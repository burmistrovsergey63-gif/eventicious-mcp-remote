import { z } from "zod";

// Raw shape for MCP SDK - source of truth
export const createSessionAttachmentShape = {
  sessionId: z.number().describe("Session ID"),
  id: z.number().describe("Attachment ID in your external system"),
  title: z.string().describe("Attachment title"),
  url: z.string().describe("Attachment URL"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const updateSessionAttachmentShape = {
  sessionId: z.number().describe("Session ID"),
  attachmentId: z.number().describe("Attachment ID"),
  title: z.string().optional(),
  url: z.string().optional(),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const deleteSessionAttachmentShape = {
  sessionId: z.number().describe("Session ID"),
  attachmentId: z.number().describe("Attachment ID"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_SESSION_ATTACHMENTS").optional().describe("Exact string required for real deletion"),
};

// Full ZodObject schemas for tests/documentation (built from shapes)
export const attachmentInputSchema = z.object({
  sessionId: z.number().describe("Session ID this attachment belongs to"),
  id: z.number().describe("Attachment ID in your external system"),
  title: z.string().describe("Attachment title"),
  url: z.string().describe("Attachment URL"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
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
  danger_confirm: z.literal("DELETE_EVENTICIOUS_SESSION_ATTACHMENTS").optional().describe("Exact string required for real deletion"),
});