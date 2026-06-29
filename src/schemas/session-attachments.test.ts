import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createSessionAttachmentShape,
  updateSessionAttachmentShape,
  deleteSessionAttachmentShape,
  attachmentInputSchema,
  attachmentUpdateSchema,
  attachmentDeleteSchema,
} from "./session-attachments";

describe("createSessionAttachmentShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(createSessionAttachmentShape);
    const result = schema.safeParse({
      sessionId: 1,
      id: 101,
      title: "Slide Deck",
      url: "https://example.com/slides.pdf",
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const schema = z.object(createSessionAttachmentShape);
    const result = schema.safeParse({ sessionId: 1, title: "Slide Deck" });
    expect(result.success).toBe(false);
  });
});

describe("updateSessionAttachmentShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(updateSessionAttachmentShape);
    const result = schema.safeParse({
      sessionId: 1,
      attachmentId: 101,
      title: "New Title",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const schema = z.object(updateSessionAttachmentShape);
    const result = schema.safeParse({
      sessionId: 1,
      attachmentId: 101,
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("deleteSessionAttachmentShape", () => {
  it("can be wrapped in z.object", () => {
    const schema = z.object(deleteSessionAttachmentShape);
    const result = schema.safeParse({
      sessionId: 1,
      attachmentId: 101,
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts danger_confirm", () => {
    const schema = z.object(deleteSessionAttachmentShape);
    const result = schema.safeParse({
      sessionId: 1,
      attachmentId: 101,
      dry_run: false,
      confirm: true,
      danger_confirm: "DELETE_EVENTICIOUS_SESSION_ATTACHMENTS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong danger_confirm", () => {
    const schema = z.object(deleteSessionAttachmentShape);
    const result = schema.safeParse({
      sessionId: 1,
      attachmentId: 101,
      dry_run: false,
      confirm: true,
      danger_confirm: "WRONG",
    });
    expect(result.success).toBe(false);
  });
});

// Legacy ZodObject tests (for backward compatibility)
describe("attachmentInputSchema", () => {
  it("validates required fields", () => {
    const result = attachmentInputSchema.safeParse({
      sessionId: 1,
      id: 101,
      title: "Slide Deck",
      url: "https://example.com/slides.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = attachmentInputSchema.safeParse({ sessionId: 1 });
    expect(result.success).toBe(false);
  });
});

describe("attachmentUpdateSchema", () => {
  it("validates update schema", () => {
    const result = attachmentUpdateSchema.safeParse({
      sessionId: 1,
      attachmentId: 101,
      title: "New Title",
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("attachmentDeleteSchema", () => {
  it("validates delete schema", () => {
    const result = attachmentDeleteSchema.safeParse({
      sessionId: 1,
      attachmentId: 101,
      dry_run: true,
    });
    expect(result.success).toBe(true);
  });
});