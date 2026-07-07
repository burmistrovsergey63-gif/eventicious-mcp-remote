import { z } from "zod";

// --- Course Settings ---
export const courseProgressSchema = z.object({
  isEnabled: z.boolean().optional().describe("Show progress bar in app"),
  hintText: z.string().max(400).optional().describe("Progress bar text (required when isEnabled=true)"),
});

export const courseFinalScreenSchema = z.object({
  isEnabled: z.boolean().optional().describe("Show final screen after completion"),
  title: z.string().max(100).optional().describe("Final screen title (required when isEnabled=true)"),
  text: z.string().max(400).optional().describe("Final screen text"),
});

export const courseNotificationSendingPeriodSchema = z.object({
  unit: z.enum(["Days", "Weeks", "Months"]).describe("Period unit"),
  value: z.number().int().min(1).max(99).describe("Period value (1-99)"),
});

export const courseNotificationSettingsSchema = z.object({
  isEnabled: z.boolean().optional().describe("Enable deadline notifications"),
  localizedText: z.record(z.string()).optional().describe("Localized notification text keyed by locale e.g. {ru-RU: ..., en-US: ...}"),
  duplicateInEmail: z.boolean().optional().describe("Duplicate notification via email"),
  sendingPeriods: z.array(courseNotificationSendingPeriodSchema).max(5).optional().describe("Sending periods (max 5)"),
});

export const courseDeadlineSchema = z.object({
  isEnabled: z.boolean().optional().describe("Enable deadline"),
  fixedDeadlineDate: z.string().optional().describe("Fixed deadline date YYYY-MM-DD (provide either this or relative)"),
  relativeDeadlineUnits: z.enum(["Days", "Weeks", "Months"]).optional().describe("Relative deadline unit"),
  relativeDeadlineValue: z.number().int().min(1).max(99).optional().describe("Relative deadline value (1-99)"),
  notificationSettings: courseNotificationSettingsSchema.optional().describe("Notification settings"),
});

export const courseSettingsSchema = z.object({
  progress: courseProgressSchema.describe("Progress settings"),
  finalScreen: courseFinalScreenSchema.describe("Final screen settings"),
  deadline: courseDeadlineSchema.describe("Deadline settings"),
  isFreeOrderAllowed: z.boolean().optional().describe("Allow arbitrary stage order"),
});

// --- Course Stages ---
export const courseStagePollSchema = z.object({
  name: z.string().min(1).describe("Poll/test name"),
});

export const courseStageTransitionSchema = z.object({
  conditionType: z.enum(["CheckInformation", "PassPoll", "PassTest"]).describe("Stage transition condition type"),
  pollButtonNameOverride: z.string().optional().describe("Button name for poll/test"),
  pollPoints: z.number().int().optional().describe("Points to complete stage"),
  poll: courseStagePollSchema.optional().describe("Poll definition (required for PassPoll/PassTest)"),
});

export const courseStageFinalMessageSchema = z.object({
  isEnabled: z.boolean().optional().describe("Enable post-completion message"),
  title: z.string().max(100).optional().describe("Message title (required when isEnabled=true)"),
  text: z.string().max(150).optional().describe("Message text"),
});

export const courseStageScormSettingsSchema = z.object({
  useFixedScores: z.boolean().optional().describe("Use fixed scores for SCORM"),
  fixedScores: z.number().optional().describe("Fixed score value (required when useFixedScores=true)"),
});

export const courseStageSettingsSchema = z.object({
  transition: courseStageTransitionSchema.optional().describe("Stage transition settings"),
  finalMessage: courseStageFinalMessageSchema.describe("Post-completion message"),
  scormSettings: courseStageScormSettingsSchema.optional().describe("SCORM-specific settings"),
});

export const courseStageTaskContentSchema = z.object({
  title: z.string().optional().describe("Task title"),
});

export const courseStageSchema = z.object({
  name: z.string().min(1).max(100).describe("Stage name"),
  comment: z.string().max(150).optional().describe("Stage comment"),
  type: z.enum(["Common", "Scorm", "Task"]).describe("Stage type"),
  settings: courseStageSettingsSchema.optional().describe("Stage settings (required for Common/Scorm)"),
  taskContent: courseStageTaskContentSchema.optional().describe("Task content config (required for Task type)"),
});

// --- Course Import Schema ---
export const courseImportSchema = {
  name: z.string().min(1).max(100).describe("Course name"),
  description: z.string().describe("Course description — required by Eventicious API"),
  coverImageFileId: z.number().int().describe("Cover image file ID (must be pre-uploaded)"),
  coverImageThumbnailFileId: z.number().int().describe("Thumbnail file ID (must be pre-uploaded)"),
  settings: courseSettingsSchema.describe("Course settings"),
  stages: z.array(courseStageSchema).optional().describe("Course stages"),
  externalId: z.string().optional().describe("External identifier"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Course Finalize Schema ---
export const courseFinalizeSchema = {
  courseId: z.number().int().describe("Course ID to finalize"),
  danger_confirm: z.literal("FINALIZE_EVENTICIOUS_COURSE").optional().describe("Exact string required for real finalization"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

// --- Image Upload Schema ---
export const courseImageUploadSchema = {
  filePaths: z.array(z.string()).min(1).max(10).optional().describe("Local file paths to upload (max 10, jpg/png). Only works if files are accessible to the server."),
  imageUrl: z.string().url().optional().describe("Public image URL to download (jpg/png, max 10 MB). Server downloads and uploads."),
  fileBase64: z.string().optional().describe("Base64-encoded image data (jpg/png). Use with optional fileName and mimeType."),
  dataUri: z.string().regex(/^data:image\//).optional().describe("Data URI with embedded image (e.g. data:image/png;base64,...)."),
  fileName: z.string().optional().describe("Filename for base64/dataUri upload (default: cover.jpg)"),
  mimeType: z.enum(["image/jpeg", "image/png"]).optional().describe("MIME type for base64 upload (auto-detected from dataUri if omitted)"),
  coverImageFileId: z.number().int().optional().describe("Already-uploaded cover image ID. If provided with coverImageThumbnailFileId, skips upload."),
  coverImageThumbnailFileId: z.number().int().optional().describe("Already-uploaded thumbnail ID. If provided with coverImageFileId, skips upload."),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};
