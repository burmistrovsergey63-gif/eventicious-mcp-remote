import { describe, it, expect } from "vitest";
import {
  validateGravityJson,
  buildInlineImagePlan,
  convertMarkdownToGravityJson,
} from "./gravity-json";

const VALID_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

describe("validateGravityJson", () => {
  it("rejects non-object input", () => {
    const result = validateGravityJson("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("GravityJson must be an object");
  });

  it("rejects non-doc root type", () => {
    const result = validateGravityJson({ type: "paragraph", content: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Root type must be");
  });

  it("accepts valid GravityJson", () => {
    const result = validateGravityJson({ type: "doc", content: [] });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("buildInlineImagePlan", () => {
  it("returns empty plan for doc without images", () => {
    const gravityJson = {
      type: "doc",
      content: [{ type: "paragraph", attrs: {}, content: [{ type: "text", text: "hello" }] }],
    };
    const plan = buildInlineImagePlan(gravityJson, {});
    expect(plan).toEqual([]);
  });

  it("detects inline images in attrs.src with dataUri", () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { src: `data:image/png;base64,${VALID_PNG_BASE64}` },
      }],
    };
    const plan = buildInlineImagePlan(gravityJson, { forceUpload: true });
    expect(plan).toHaveLength(1);
    expect(plan[0].action).toBe("upload_inline_image");
    expect(plan[0].provider).toBe("imgbb");
  });

  it("detects inline images in attrs.dataUri", () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { dataUri: `data:image/png;base64,${VALID_PNG_BASE64}` },
      }],
    };
    const plan = buildInlineImagePlan(gravityJson, { forceUpload: true });
    expect(plan).toHaveLength(1);
  });

  it("detects inline images in attrs.fileBase64", () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
      }],
    };
    const plan = buildInlineImagePlan(gravityJson, { forceUpload: true });
    expect(plan).toHaveLength(1);
  });

  it("skips public HTTPS imageUrl when not forceUpload", () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { imageUrl: "https://i.ibb.co/abc123/test.png" },
      }],
    };
    const plan = buildInlineImagePlan(gravityJson, { forceUpload: false });
    expect(plan).toEqual([]);
  });

  it("includes non-public imageUrl when forceUpload", () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { imageUrl: "http://example.com/image.png" },
      }],
    };
    const plan = buildInlineImagePlan(gravityJson, { forceUpload: true });
    expect(plan).toHaveLength(1);
  });

  it("rejects fileId in image attrs", () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { fileId: "abc123" },
      }],
    };
    expect(() => buildInlineImagePlan(gravityJson, {})).toThrow(
      "fileId подходит для обложки курса, но не для картинки внутри текста"
    );
  });

  it("processes nested image nodes", () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "bullet_list",
        attrs: {},
        content: [{
          type: "list_item",
          attrs: {},
          content: [{
            type: "paragraph",
            attrs: {},
            content: [{
              type: "image",
              attrs: { src: `data:image/png;base64,${VALID_PNG_BASE64}` },
            }],
          }],
        }],
      }],
    };
    const plan = buildInlineImagePlan(gravityJson, { forceUpload: true });
    expect(plan).toHaveLength(1);
  });
});

describe("convertMarkdownToGravityJson", () => {
  it("converts plain text to paragraph", () => {
    const result = convertMarkdownToGravityJson("Hello world");
    expect(result.result.type).toBe("doc");
    const content = result.result.content as unknown[];
    expect(content).toHaveLength(1);
    const para = content[0] as Record<string, unknown>;
    expect(para.type).toBe("paragraph");
  });

  it("converts heading", () => {
    const result = convertMarkdownToGravityJson("# Title");
    const content = result.result.content as unknown[];
    const heading = content[0] as Record<string, unknown>;
    expect(heading.type).toBe("heading");
    const attrs = heading.attrs as Record<string, unknown>;
    expect(attrs.level).toBe(1);
  });

  it("converts bullet list", () => {
    const result = convertMarkdownToGravityJson("- Item 1\n- Item 2");
    const content = result.result.content as unknown[];
    expect(content).toHaveLength(1);
    const list = content[0] as Record<string, unknown>;
    expect(list.type).toBe("bullet_list");
  });

  it("warns on empty input", () => {
    const result = convertMarkdownToGravityJson("");
    expect(result.warnings).toContain("Input produced empty document");
  });
});
