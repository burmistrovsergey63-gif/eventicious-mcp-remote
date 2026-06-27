import { z } from "zod";

// --- Course Import Helper Schemas ---

// Schema for prepare_course_import input
export const courseImportPlanInputSchema = z.object({
  name: z.string().min(1).max(100).describe("Course name"),
  description: z.string().optional().describe("Course description"),
  coverImageFileId: z.number().int().optional().describe("Cover image file ID (if already uploaded)"),
  coverImageThumbnailFileId: z.number().int().optional().describe("Thumbnail file ID (if already uploaded)"),
  settings: z.object({
    progress: z.object({
      isEnabled: z.boolean().optional(),
      hintText: z.string().optional(),
    }).optional(),
    finalScreen: z.object({
      isEnabled: z.boolean().optional(),
      title: z.string().optional(),
      text: z.string().optional(),
    }).optional(),
    deadline: z.object({
      isEnabled: z.boolean().optional(),
      fixedDeadlineDate: z.string().optional(),
      relativeDeadlineUnits: z.enum(["Days", "Weeks", "Months"]).optional(),
      relativeDeadlineValue: z.number().int().optional(),
      notificationSettings: z.object({
        isEnabled: z.boolean().optional(),
        localizedText: z.record(z.string()).optional(),
        duplicateInEmail: z.boolean().optional(),
        sendingPeriods: z.array(z.object({
          unit: z.enum(["Days", "Weeks", "Months"]),
          value: z.number().int().min(1).max(99),
        })).optional(),
      }).optional(),
    }).optional(),
    isFreeOrderAllowed: z.boolean().optional(),
  }).optional().describe("Course settings"),
  stages: z.array(z.object({
    name: z.string().min(1).max(100),
    comment: z.string().optional(),
    type: z.enum(["Common", "Scorm", "Task"]),
    settings: z.any().optional(),
    taskContent: z.any().optional(),
  })).optional().describe("Course stages"),
  polls: z.array(z.any()).optional().describe("Poll/test content plans"),
  tasks: z.array(z.any()).optional().describe("Task content plans"),
  scormArchives: z.array(z.string()).optional().describe("SCORM archive file paths"),
  externalId: z.string().optional().describe("External identifier"),
});

// Schema for validate_course_plan
export const coursePlanValidationSchema = z.object({
  coursePlan: courseImportPlanInputSchema.describe("Course plan to validate"),
});

// Schema for map_course_import_response
export const courseImportResponseMapSchema = z.object({
  importResponse: z.any().describe("Response from eventicious_import_course_structure"),
});

// Schema for check_course_ready_to_finalize
export const courseReadyToFinalizeSchema = z.object({
  courseId: z.number().int().describe("Course ID"),
  coursePlan: courseImportPlanInputSchema.describe("Original course plan"),
  importResponseMap: z.any().optional().describe("Mapped import response"),
  filledContentStatus: z.object({
    catalogsFilled: z.boolean().optional().describe("Stage catalogs filled via catalog tools"),
    pollsFilled: z.boolean().optional().describe("All poll/test content imported"),
    tasksFilled: z.boolean().optional().describe("All task content imported"),
    scormUploaded: z.boolean().optional().describe("All SCORM archives uploaded"),
    coverUploaded: z.boolean().optional().describe("Cover image uploaded"),
    attachmentsUploaded: z.boolean().optional().describe("Task attachments uploaded"),
  }).describe("Content fill status"),
});
