import { z } from "zod";

export const userInputSchema = z.object({
  id: z.number().describe("External system user ID"),
  firstName: z.string().describe("First name"),
  lastName: z.string().describe("Last name"),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  division: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  region: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  externalImagePath: z.string().optional(),
  aclGroupIds: z.array(z.number()).optional(),
});

export const userIdsSchema = z.object({
  userIds: z.array(z.number()).min(1).max(200),
});

export const deleteUsersSchema = z.object({
  userIds: z.array(z.number()).min(1).max(200),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_USERS").describe("Exact string required for delete"),
});

export const mentorSchema = z.object({
  mentorId: z.number().describe("External system user ID of the mentor"),
  menteeIds: z.array(z.number()).min(1).max(200).describe("External system user IDs of mentees"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
});
