import { z } from "zod";

// --- SCORM Upload Schema ---
export const scormUploadSchema = {
  courseId: z.number().int().describe("Course ID"),
  stageId: z.number().int().describe("Stage ID"),
  scormId: z.number().int().describe("SCORM ID (from course import response)"),
  filePath: z.string().describe("Local path to SCORM .zip archive"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};
