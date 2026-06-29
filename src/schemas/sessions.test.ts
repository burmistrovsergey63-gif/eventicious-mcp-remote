import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createSessionShape,
  updateSessionShape,
  deleteSessionShape,
  sessionCreateSchema,
  sessionUpdateSchema,
  sessionDeleteSchema,
} from "./sessions";

describe("createSessionShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(createSessionShape);
    const result = schema.safeParse({
      id: 1,
      title: "Test Session",
      startTime: "2026-09-01T10:00",
      endTime: "2026-09-01T11:00",
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const schema = z.object(createSessionShape);
    const result = schema.safeParse({ title: "Test Session" });
    expect(result.success).toBe(false);
  });
});

describe("updateSessionShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(updateSessionShape);
    const result = schema.safeParse({ id: 1, title: "New Title" });
    expect(result.success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const schema = z.object(updateSessionShape);
    const result = schema.safeParse({
      id: 1,
      title: "New Title",
      description: "<p>Desc</p>",
      startTime: "2026-09-01T10:00",
      tagIds: [1, 2],
      speakersIds: [3, 4],
      locationsIds: [5, 6],
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("deleteSessionShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(deleteSessionShape);
    const result = schema.safeParse({ id: 1, dry_run: true });
    expect(result.success).toBe(true);
  });

  it("accepts danger_confirm", () => {
    const schema = z.object(deleteSessionShape);
    const result = schema.safeParse({
      id: 1,
      dry_run: false,
      confirm: true,
      danger_confirm: "DELETE_EVENTICIOUS_SESSIONS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong danger_confirm", () => {
    const schema = z.object(deleteSessionShape);
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
describe("sessionCreateSchema", () => {
  it("validates required fields", () => {
    const result = sessionCreateSchema.safeParse({
      id: 1,
      title: "Test Session",
      startTime: "2026-09-01T10:00",
      endTime: "2026-09-01T11:00",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = sessionCreateSchema.safeParse({
      id: 1,
      title: "Test Session",
      startTime: "2026-09-01T10:00",
      endTime: "2026-09-01T11:00",
      description: "<p>Desc</p>",
      speakersIds: [1, 2],
    });
    expect(result.success).toBe(true);
  });
});

describe("sessionUpdateSchema", () => {
  it("validates update schema", () => {
    const result = sessionUpdateSchema.safeParse({
      id: 1,
      title: "New Title",
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("sessionDeleteSchema", () => {
  it("accepts dry_run only", () => {
    const result = sessionDeleteSchema.safeParse({
      id: 1,
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});