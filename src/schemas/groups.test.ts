import { describe, it, expect } from "vitest";
import { aclGroupSchema, moveUsersSchema, updateAclGroupSchema, deleteAclGroupSchema, rolesSchema } from "./groups";

describe("aclGroupSchema", () => {
  it("validates required fields", () => {
    const result = aclGroupSchema.safeParse({ id: 1, name: "Group A" });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = aclGroupSchema.safeParse({ name: "Group A" });
    expect(result.success).toBe(false);
  });
});

describe("moveUsersSchema", () => {
  it("validates with all fields", () => {
    const result = moveUsersSchema.safeParse({
      userIds: [1, 2, 3],
      groupIdsAddTo: [10],
      groupIdsRemoveFrom: [20],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty userIds", () => {
    const result = moveUsersSchema.safeParse({
      userIds: [],
      groupIdsAddTo: [],
      groupIdsRemoveFrom: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateAclGroupSchema", () => {
  it("validates update schema", () => {
    const result = updateAclGroupSchema.safeParse({
      id: 1,
      name: "New Name",
      dry_run: true,
      confirm: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("deleteAclGroupSchema", () => {
  it("accepts dry_run only", () => {
    const result = deleteAclGroupSchema.safeParse({
      id: 1,
      dry_run: true,
      confirm: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts danger_confirm", () => {
    const result = deleteAclGroupSchema.safeParse({
      id: 1,
      dry_run: false,
      confirm: true,
      danger_confirm: "DELETE_EVENTICIOUS_ACL_GROUP",
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong danger_confirm", () => {
    const result = deleteAclGroupSchema.safeParse({
      id: 1,
      dry_run: false,
      confirm: true,
      danger_confirm: "WRONG",
    });
    expect(result.success).toBe(false);
  });
});

describe("rolesSchema", () => {
  it("validates role assignment", () => {
    const result = rolesSchema.safeParse({
      roleInfo: [{ groupId: 1, userId: 2, roleIds: [1] }],
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});