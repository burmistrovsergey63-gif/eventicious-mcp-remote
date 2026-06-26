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
