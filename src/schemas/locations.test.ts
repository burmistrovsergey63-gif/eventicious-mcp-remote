import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createLocationShape,
  updateLocationShape,
  deleteLocationShape,
  locationCreateSchema,
  locationUpdateSchema,
  locationDeleteSchema,
} from "./locations";

describe("createLocationShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(createLocationShape);
    const result = schema.safeParse({
      id: 1,
      name: "Main Hall",
      position: 1,
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const schema = z.object(createLocationShape);
    const result = schema.safeParse({ name: "Main Hall" });
    expect(result.success).toBe(false);
  });
});

describe("updateLocationShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(updateLocationShape);
    const result = schema.safeParse({ id: 1, name: "New Name", position: 2 });
    expect(result.success).toBe(true);
  });
});

describe("deleteLocationShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(deleteLocationShape);
    const result = schema.safeParse({ id: 1, dry_run: true });
    expect(result.success).toBe(true);
  });

  it("accepts danger_confirm", () => {
    const schema = z.object(deleteLocationShape);
    const result = schema.safeParse({
      id: 1,
      dry_run: false,
      confirm: true,
      danger_confirm: "DELETE_EVENTICIOUS_LOCATIONS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong danger_confirm", () => {
    const schema = z.object(deleteLocationShape);
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
describe("locationCreateSchema", () => {
  it("validates required fields", () => {
    const result = locationCreateSchema.safeParse({
      id: 1,
      name: "Main Hall",
      position: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = locationCreateSchema.safeParse({ id: 1 });
    expect(result.success).toBe(false);
  });
});

describe("locationUpdateSchema", () => {
  it("validates update schema", () => {
    const result = locationUpdateSchema.safeParse({
      id: 1,
      name: "New Name",
      position: 1,
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("locationDeleteSchema", () => {
  it("accepts dry_run only", () => {
    const result = locationDeleteSchema.safeParse({
      id: 1,
      dry_run: true,
      confirm: false,
    });
    expect(result.success).toBe(true);
  });
});