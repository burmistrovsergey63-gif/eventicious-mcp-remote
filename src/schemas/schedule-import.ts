import { z } from "zod";

export const scheduleRowSchema = z.object({
  title: z.string().describe("Session title"),
  description: z.string().optional(),
  startDate: z.string().optional().describe("YYYY-MM-DD"),
  startTime: z.string().optional().describe("HH:mm"),
  startsAt: z.string().optional().describe("ISO 8601 datetime alternative to startDate+startTime"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  endsAt: z.string().optional(),
  locationName: z.string().optional(),
  locationId: z.number().optional(),
  tagNames: z.array(z.string()).optional(),
  tagIds: z.array(z.number()).optional(),
  speakerNames: z.array(z.string()).optional(),
  speakerEmails: z.array(z.string()).optional(),
  speakerIds: z.array(z.number()).optional(),
  aclGroupNames: z.array(z.string()).optional(),
  aclGroupsIds: z.array(z.number()).optional(),
  attachments: z.array(z.object({
    title: z.string(),
    url: z.string(),
  })).optional(),
  externalId: z.string().optional(),
  type: z.number().optional().describe("0=speech, 1=coffee-break, 2=filler"),
});

export const prepareScheduleImportSchema = z.object({
  rows: z.array(scheduleRowSchema).min(1).describe("Schedule rows from Excel/JSON"),
  existingLocations: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  existingTags: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  existingAclGroups: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  existingUsersOrSpeakers: z.array(z.object({ id: z.number(), firstName: z.string(), lastName: z.string(), email: z.string().optional() })).optional(),
  options: z.object({
    createMissingLocations: z.boolean().default(true),
    createMissingTags: z.boolean().default(true),
    createMissingAclGroups: z.boolean().default(false),
    createMissingSpeakersAsUsers: z.boolean().default(false),
    timezone: z.string().optional(),
    defaultLanguage: z.string().optional(),
  }).optional(),
});

export const validateSchedulePlanSchema = z.object({
  plan: z.any().describe("Output from eventicious_prepare_schedule_import"),
});
