import { z } from "zod";

// Raw shape for MCP SDK - source of truth
export const createAclGroupShape = {
  id: z.number().describe("Group ID in your external system"),
  name: z.string().describe("Group name"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const updateAclGroupShape = {
  id: z.number().describe("Group ID in your external system"),
  name: z.string().describe("New group name"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const deleteAclGroupShape = {
  id: z.number().describe("Group ID in your external system"),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
  danger_confirm: z.literal("DELETE_EVENTICIOUS_ACL_GROUP").optional().describe("Exact string required for real deletion"),
};

export const moveUsersShape = {
  userIds: z.array(z.number()).min(1),
  groupIdsAddTo: z.array(z.number()),
  groupIdsRemoveFrom: z.array(z.number()),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const roleInfoShape = {
  groupId: z.number().describe("Group ID in your external system"),
  userId: z.number().describe("User ID in your external system"),
  roleIds: z.array(z.number()).min(1).describe("Role IDs: 1=Curator, 2=Supervisor"),
};

export const addRolesShape = {
  roleInfo: z.array(
    z.object(roleInfoShape)
  ).min(1),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

export const removeRolesShape = {
  roleInfo: z.array(
    z.object(roleInfoShape)
  ).min(1),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
};

// Full ZodObject schemas for tests/documentation (built from shapes)
export const aclGroupSchema = z.object({
  id: z.number().describe("Group ID in your external system"),
  name: z.string().describe("Group name"),
});

export const moveUsersSchema = z.object({
  userIds: z.array(z.number()).min(1).max(200),
  groupIdsAddTo: z.array(z.number()),
  groupIdsRemoveFrom: z.array(z.number()),
});

export const updateAclGroupSchema = z.object(updateAclGroupShape);

export const deleteAclGroupSchema = z.object(deleteAclGroupShape);

export const roleInfoSchema = z.object(roleInfoShape);

export const rolesSchema = z.object({
  roleInfo: z.array(roleInfoSchema).min(1).max(200),
  dry_run: z.boolean().default(true),
  confirm: z.boolean().default(false),
});