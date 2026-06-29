import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createUserShape,
  updateUserShape,
  blockUsersShape,
  unblockUsersShape,
  deleteUsersShape,
  addMentorsShape,
  removeMentorsShape,
  userInputSchema,
  userIdsSchema,
  deleteUsersSchema,
  mentorSchema,
} from "./users";

describe("createUserShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(createUserShape);
    const result = schema.safeParse({
      users: [{ id: 123, firstName: "John", lastName: "Doe" }],
      dry_run: true,
      confirm: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty users array", () => {
    const schema = z.object(createUserShape);
    const result = schema.safeParse({ users: [] });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields in user", () => {
    const schema = z.object(createUserShape);
    const result = schema.safeParse({
      users: [{ firstName: "John" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(updateUserShape);
    const result = schema.safeParse({
      users: [{ id: 123, firstName: "John" }],
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("blockUsersShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(blockUsersShape);
    const result = schema.safeParse({ userIds: [1, 2, 3], dry_run: true });
    expect(result.success).toBe(true);
  });
});

describe("unblockUsersShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(unblockUsersShape);
    const result = schema.safeParse({ userIds: [1, 2, 3], dry_run: true });
    expect(result.success).toBe(true);
  });
});

describe("deleteUsersShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(deleteUsersShape);
    const result = schema.safeParse({ userIds: [1], dry_run: true });
    expect(result.success).toBe(true);
  });

  it("accepts danger_confirm", () => {
    const schema = z.object(deleteUsersShape);
    const result = schema.safeParse({
      userIds: [1],
      dry_run: false,
      confirm: true,
      danger_confirm: "DELETE_EVENTICIOUS_USERS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong danger_confirm value", () => {
    const schema = z.object(deleteUsersShape);
    const result = schema.safeParse({
      userIds: [1],
      dry_run: false,
      confirm: true,
      danger_confirm: "WRONG_VALUE",
    });
    expect(result.success).toBe(false);
  });
});

describe("addMentorsShape and removeMentorsShape", () => {
  it("addMentorsShape validates", () => {
    const schema = z.object(addMentorsShape);
    const result = schema.safeParse({
      mentorId: 1,
      menteeIds: [2, 3],
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });

  it("removeMentorsShape validates", () => {
    const schema = z.object(removeMentorsShape);
    const result = schema.safeParse({
      mentorId: 1,
      menteeIds: [2, 3],
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});

// Legacy ZodObject tests (for backward compatibility)
describe("userInputSchema", () => {
  it("validates required fields", () => {
    const result = userInputSchema.safeParse({
      id: 123,
      firstName: "John",
      lastName: "Doe",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = userInputSchema.safeParse({
      id: 123,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      company: "Acme",
      aclGroupIds: [1, 2, 3],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = userInputSchema.safeParse({ id: 123 });
    expect(result.success).toBe(false);
  });
});

describe("userIdsSchema", () => {
  it("validates userIds array", () => {
    const result = userIdsSchema.safeParse({ userIds: [1, 2, 3] });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = userIdsSchema.safeParse({ userIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejects without max limit", () => {
    const result = userIdsSchema.safeParse({ userIds: Array(201).fill(1) });
    expect(result.success).toBe(false);
  });
});

describe("deleteUsersSchema", () => {
  it("accepts dry_run only", () => {
    const result = deleteUsersSchema.safeParse({
      userIds: [1],
      dry_run: true,
      confirm: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dry_run).toBe(true);
    }
  });

  it("accepts danger_confirm", () => {
    const result = deleteUsersSchema.safeParse({
      userIds: [1],
      dry_run: false,
      confirm: true,
      danger_confirm: "DELETE_EVENTICIOUS_USERS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong danger_confirm value", () => {
    const result = deleteUsersSchema.safeParse({
      userIds: [1],
      dry_run: false,
      confirm: true,
      danger_confirm: "WRONG_VALUE",
    });
    expect(result.success).toBe(false);
  });
});

describe("mentorSchema", () => {
  it("validates mentor assignment", () => {
    const result = mentorSchema.safeParse({
      mentorId: 1,
      menteeIds: [2, 3, 4],
      dry_run: true,
      confirm: false,
    });
    expect(result.success).toBe(true);
  });
});