import { z } from "zod";

// --- Poll Schemas ---
export const pollQuestionOptionDataSchema = z.union([
  z.object({ text: z.string().max(1500).describe("Option text") }),
  z.object({
    min: z.number().int().describe("Scale min"),
    max: z.number().int().describe("Scale max"),
    current: z.number().int().describe("Scale current value"),
  }),
]);

export const pollQuestionOptionSchema = z.object({
  rate: z.number().int().optional().describe("Score for this option"),
  isRight: z.boolean().optional().describe("Is correct answer"),
  imageFileId: z.number().int().optional().describe("Pre-uploaded image ID"),
  optionData: pollQuestionOptionDataSchema.describe("Option data (text or scale)"),
});

export const pollQuestionSchema = z.object({
  text: z.string().max(1500).describe("Question text"),
  type: z.enum(["FreeText", "SingleSelect", "MultiSelect", "Stars"]).describe("Question type"),
  imageFileId: z.number().int().optional().describe("Pre-uploaded image ID"),
  options: z.array(pollQuestionOptionSchema).optional().describe("Answer options (required for non-FreeText)"),
});

export const pollScreenSchema = z.object({
  title: z.string().max(1500).describe("Screen title"),
  canHaveMultipleQuestions: z.boolean().optional().describe("Allow multiple questions on screen"),
  questions: z.array(pollQuestionSchema).min(1).describe("Questions (at least 1)"),
});

export const pollResultScreenRateRangeSchema = z.object({
  start: z.number().int().describe("Range start (>= 0)"),
  end: z.number().int().optional().describe("Range end (>= start)"),
  comment: z.string().max(400).optional().describe("Range comment"),
});

export const pollResultScreenSettingsSchema = z.object({
  topic: z.string().max(100).optional().describe("Result screen topic"),
  comment: z.string().max(400).optional().describe("Result screen comment"),
  showRates: z.boolean().optional().describe("Show rates (required for Test types)"),
  rateRanges: z.array(pollResultScreenRateRangeSchema).optional().describe("Rate ranges (required when showRates=true)"),
  locale: z.string().optional().describe("Locale"),
});

export const pollImportSchema = {
  pollId: z.number().int().describe("Poll/test ID (from course import response)"),
  name: z.string().max(500).optional().describe("Poll/test name"),
  type: z.enum(["Common", "TestWithoutAnswers", "TestWithAnswers"]).describe("Poll type"),
  isAuthRequired: z.boolean().optional().describe("Require auth to pass"),
  canSkipQuestions: z.boolean().optional().describe("Allow skipping questions (Common type)"),
  showRightAnswerAfterAnswerComplete: z.boolean().optional().describe("Show correct answer after each answer (TestWithAnswers)"),
  showRightAnswerAfterTestComplete: z.boolean().optional().describe("Show correct answers after test completion (TestWithAnswers)"),
  showRightAnswerType: z.enum(["OnlyAttendee", "AttendeeWithTotal"]).optional().describe("Show answer type (TestWithAnswers)"),
  overrideGlobalSettings: z.boolean().optional().describe("Override global settings"),
  sendPushOnStart: z.boolean().optional().describe("Send push notification on start"),
  duplicateInEmail: z.boolean().optional().describe("Duplicate notification via email"),
  showResults: z.boolean().optional().describe("Show results to attendees"),
  canBeRetaken: z.boolean().optional().describe("Allow retaking"),
  shuffleQuestions: z.boolean().optional().describe("Shuffle questions (TestWithAnswers)"),
  shuffleOptions: z.boolean().optional().describe("Shuffle answer options (TestWithAnswers)"),
  isQuestionRandomSetEnabled: z.boolean().optional().describe("Enable random question subset (TestWithAnswers)"),
  questionRandomSetSize: z.number().int().optional().describe("Random question subset size"),
  questionRandomSetScore: z.number().int().optional().describe("Score for random question set"),
  screens: z.array(pollScreenSchema).min(1).describe("Poll screens (at least 1)"),
  resultScreenSettings: pollResultScreenSettingsSchema.describe("Result screen settings"),
  dry_run: z.boolean().default(true).describe("Preview only"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};
