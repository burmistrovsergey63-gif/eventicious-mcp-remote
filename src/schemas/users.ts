import { z } from "zod";

// Raw shape for MCP SDK - source of truth
export const createUserShape = {
  users: z
    .array(
      z.object({
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
      })
    )
    .min(1),
  dry_run: z.boolean().default(true).describe("Preview only, do not execute"),
  confirm: z.boolean().default(false).describe("Must be true to execute when dry_run=false"),
};

export const updateUserShape = {
  users: z
    .array(
      z.object({
        id: z.number().describe("External system user ID"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
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
      })
    )
    .min(1),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const blockUsersShape = {
  userIds: z.array(z.number()).min(1),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const unblockUsersShape = {
  userIds: z.array(z.number()).min(1),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const deleteUsersShape = {
  userIds: z.array(z.number()).min(1),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_USERS").optional().describe("Exact string required for real deletion"),
};

export const mentorBaseShape = {
  mentorId: z.number().describe("External system user ID of the mentor"),
  menteeIds: z.array(z.number()).min(1).describe("External system user IDs of mentees"),
};

export const addMentorsShape = {
  ...mentorBaseShape,
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const removeMentorsShape = {
  ...mentorBaseShape,
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

// Full ZodObject schemas for tests/documentation (built from shapes)
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
  danger_confirm: z.literal("DELETE_EVENTICIOUS_USERS").optional().describe("Exact string required for real deletion"),
});

export const mentorSchema = z.object({
  mentorId: z.number().describe("External system user ID of the mentor"),
  menteeIds: z.array(z.number()).min(1).max(200).describe("External system user IDs of mentees"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
});