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

export const updateAclGroupSchema = z.object({
  id: z.number().describe("Group ID in your external system"),
  name: z.string().describe("New group name"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
});

export const deleteAclGroupSchema = z.object({
  id: z.number().describe("Group ID in your external system"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_ACL_GROUP").optional().describe("Exact string required for real deletion"),
});

export const roleInfoSchema = z.object({
  groupId: z.number().describe("Group ID in your external system"),
  userId: z.number().describe("User ID in your external system"),
  roleIds: z.array(z.number()).min(1).describe("Role IDs: 1=Curator, 2=Supervisor"),
});

export const rolesSchema = z.object({
  roleInfo: z.array(roleInfoSchema).min(1).max(200),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
});
