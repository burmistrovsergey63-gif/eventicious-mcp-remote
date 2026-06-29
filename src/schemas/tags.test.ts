import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createTagShape,
  updateTagShape,
  deleteTagShape,
  tagCreateSchema,
  tagUpdateSchema,
  tagDeleteSchema,
} from "./tags";

describe("createTagShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(createTagShape);
    const result = schema.safeParse({
      id: 1,
      name: "New Tag",
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const schema = z.object(createTagShape);
    const result = schema.safeParse({ name: "New Tag" });
    expect(result.success).toBe(false);
  });

  it("accepts optional color field", () => {
    const schema = z.object(createTagShape);
    const result = schema.safeParse({
      id: 1,
      name: "New Tag",
      color: "#FF0000",
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateTagShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(updateTagShape);
    const result = schema.safeParse({ id: 1, name: "Updated Tag", dry_run: true });
    expect(result.success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const schema = z.object(updateTagShape);
    const result = schema.safeParse({
      id: 1,
      name: "Updated Name",
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("deleteTagShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(deleteTagShape);
    const result = schema.safeParse({ id: 1, dry_run: true });
    expect(result.success).toBe(true);
  });

  it("accepts danger_confirm", () => {
    const schema = z.object(deleteTagShape);
    const result = schema.safeParse({
      id: 1,
      dry_run: false,
      confirm: true,
      danger_confirm: "DELETE_EVENTICIOUS_TAGS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong danger_confirm", () => {
    const schema = z.object(deleteTagShape);
    const result = schema.safeParse({
      id: 1,
      dry_run: false,
      confirm: true,
      danger_confirm: "WRONG",
    });
    expect(result.success).toBe(false);
  });
});

// Legacy ZodObject tests (for backward compatibility)
describe("tagCreateSchema", () => {
  it("validates required fields", () => {
    const result = tagCreateSchema.safeParse({
      id: 1,
      name: "New Tag",
    });
    expect(result.success).toBe(true);
  });
});

describe("tagUpdateSchema", () => {
  it("validates update schema", () => {
    const result = tagUpdateSchema.safeParse({
      id: 1,
      name: "Updated Tag",
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("tagDeleteSchema", () => {
  it("accepts dry_run only", () => {
    const result = tagDeleteSchema.safeParse({
      id: 1,
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});