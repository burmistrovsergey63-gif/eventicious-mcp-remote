import { z } from "zod";

export const aclGroupSchema = z.object({
  id: z.number().describe("Group ID in your external system"),
  name: z.string().describe("Group name"),
});

export const moveUsersSchema = z.object({
  userIds: z.array(z.number()).min(1).max(200),
  groupIdsAddTo: z.array(z.number()),
  groupIdsRemoveFrom: z.array(z.number()),
});
