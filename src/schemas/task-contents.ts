import { z } from "zod";

// --- Task Content Schemas ---
export const taskContentScreenInfoSchema = z.object({
  showScore: z.boolean().optional().describe("Show score on screen"),
  completedTitle: z.string().optional().describe("Accepted task message"),
  rejectedTitle: z.string().optional().describe("Rejected task message"),
  inReviewTitle: z.string().optional().describe("In-review message"),
});

export const taskContentReviewInfoSchema = z.object({
  isReviewRequired: z.boolean().optional().describe("Review required"),
  duplicateInEmail: z.boolean().optional().describe("Email duplicate"),
  takePartInRating: z.boolean().optional().describe("Part of rating"),
  maxScore: z.number().int().min(0).optional().describe("Max score (>= 0)"),
});

export const taskContentCompletionInfoSchema = z.object({
  canBeRetaken: z.boolean().optional().describe("Allow retake"),
});

export const taskContentNotificationInfoSchema = z.object({
  isEnabled: z.boolean().optional().describe("Enable notifications"),
  sendToCurator: z.boolean().optional().describe("Notify curator"),
  sendToLeader: z.boolean().optional().describe("Notify leader"),
  sendToMentor: z.boolean().optional().describe("Notify mentor"),
  text: z.string().optional().describe("Notification text (required when isEnabled=true)"),
  duplicateInEmail: z.boolean().optional().describe("Email duplicate"),
});

export const taskContentSettingsSchema = z.object({
  screenInfo: taskContentScreenInfoSchema.optional().describe("Screen settings"),
  reviewInfo: taskContentReviewInfoSchema.optional().describe("Review settings"),
  completionInfo: taskContentCompletionInfoSchema.optional().describe("Completion settings"),
  notificationInfo: taskContentNotificationInfoSchema.optional().describe("Notification settings"),
});

export const fieldOptionSchema = z.object({
  order: z.number().int().optional().describe("Display order"),
  value: z.string().describe("Option value text"),
});

export const fieldSettingsSchema = z.object({
  multiSelect: z.boolean().optional().describe("Allow multiple selection (Select type)"),
  options: z.array(fieldOptionSchema).optional().describe("Options (Select type)"),
  groups: z.array(z.number().int()).optional().describe("Group external IDs (SelectUser type)"),
});

export const taskFieldSchema = z.object({
  title: z.string().max(500).describe("Field title"),
  description: z.string().max(500).optional().describe("Field description"),
  type: z.enum(["String", "Text", "Url", "Attachment", "AttachmentOrUrl", "Select", "SelectUser"]).describe("Field type"),
  required: z.boolean().optional().describe("User must fill this field"),
  settings: fieldSettingsSchema.optional().describe("Field settings (required for Select/SelectUser)"),
});

export const taskContentImportSchema = {
  taskContentId: z.number().int().describe("Task content ID (from course import response)"),
  coverImageFileId: z.number().int().optional().describe("Cover image file ID"),
  title: z.string().describe("Task title"),
  description: z.string().optional().describe("Task description"),
  settings: taskContentSettingsSchema.describe("Task settings"),
  attachmentFileIds: z.array(z.number().int()).optional().describe("Pre-uploaded attachment file IDs"),
  fields: z.array(taskFieldSchema).optional().describe("Task fields"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Task Attachment Upload Schema ---
export const taskAttachmentUploadSchema = {
  filePaths: z.array(z.string()).min(1).max(5).describe("Local file paths to upload (max 5)"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};
