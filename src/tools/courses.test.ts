import { describe, it, expect, vi } from "vitest";
import { courseImageUploadSchema } from "../schemas/courses";

function createToolError(msg: string) {
  return { content: [{ type: "text" as const, text: msg }], isError: true as const };
}

const MOCK_CREDENTIALS = { baseUrl: "https://api.test.com/", clientId: "c", clientSecret: "s" };

async function getUploadHandler() {
  const { registerCourseTools } = await import("./courses");
  const mockServer = { tool: vi.fn() };
  registerCourseTools(mockServer as any, MOCK_CREDENTIALS, createToolError);
  const call = (mockServer.tool.mock.calls as any[]).find(
    (c: any[]) => c[0] === "eventicious_upload_course_images"
  );
  return call?.[3] as Function;
}

async function getPrepareHandler() {
  const { registerCourseImportTools } = await import("./course-import");
  const mockServer = { tool: vi.fn() };
  registerCourseImportTools(mockServer as any, createToolError);
  const call = (mockServer.tool.mock.calls as any[]).find(
    (c: any[]) => c[0] === "eventicious_prepare_course_import"
  );
  return call?.[3] as Function;
}

describe("courseImageUploadSchema", () => {
  it("accepts filePaths", () => {
    const r = courseImageUploadSchema.filePaths.safeParse(["/path/to/cover.jpg"]);
    expect(r.success).toBe(true);
  });
  it("accepts imageUrl", () => {
    const r = courseImageUploadSchema.imageUrl.safeParse("https://example.com/cover.jpg");
    expect(r.success).toBe(true);
  });
  it("accepts fileBase64", () => {
    const r = courseImageUploadSchema.fileBase64.safeParse("iVBORw0KGgo=");
    expect(r.success).toBe(true);
  });
  it("accepts dataUri", () => {
    const r = courseImageUploadSchema.dataUri.safeParse("data:image/png;base64,iVBORw0KGgo=");
    expect(r.success).toBe(true);
  });
  it("accepts existing IDs", () => {
    expect(courseImageUploadSchema.coverImageFileId.safeParse(123).success).toBe(true);
    expect(courseImageUploadSchema.coverImageThumbnailFileId.safeParse(456).success).toBe(true);
  });
  it("rejects non-array filePaths", () => {
    expect(courseImageUploadSchema.filePaths.safeParse("not-an-array").success).toBe(false);
  });
  it("rejects invalid imageUrl", () => {
    expect(courseImageUploadSchema.imageUrl.safeParse("not-a-url").success).toBe(false);
  });
  it("rejects invalid mimeType", () => {
    expect(courseImageUploadSchema.mimeType.safeParse("image/gif").success).toBe(false);
  });
  it("rejects dataUri without image prefix", () => {
    expect(courseImageUploadSchema.dataUri.safeParse("data:text/plain;base64,abc").success).toBe(false);
  });
});

describe("upload_course_images: input mode validation", () => {
  it("rejects no input mode", async () => {
    const handler = await getUploadHandler();
    const result = await handler({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Provide exactly one input mode");
  });

  it("rejects multiple input modes", async () => {
    const handler = await getUploadHandler();
    const result = await handler({
      imageUrl: "https://example.com/cover.jpg",
      filePaths: ["/local/cover.jpg"],
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Multiple modes detected");
  });
});

describe("upload_course_images: existing IDs", () => {
  it("returns IDs directly (dry_run)", async () => {
    const handler = await getUploadHandler();
    const result = await handler({ coverImageFileId: 100, coverImageThumbnailFileId: 200, dry_run: true });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.dry_run).toBe(true);
    expect(parsed.preview.coverImageFileId).toBe(100);
    expect(parsed.preview.coverImageThumbnailFileId).toBe(200);
    expect(result.isError).toBeUndefined();
  });

  it("returns IDs directly (real)", async () => {
    const handler = await getUploadHandler();
    const result = await handler({ coverImageFileId: 100, coverImageThumbnailFileId: 200, dry_run: false, confirm: true });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.coverImageFileId).toBe(100);
    expect(parsed.coverImageThumbnailFileId).toBe(200);
    expect(result.isError).toBeUndefined();
  });
});

describe("upload_course_images: imageUrl mode", () => {
  it("dry_run returns preview", async () => {
    const handler = await getUploadHandler();
    const result = await handler({ imageUrl: "https://example.com/cover.jpg", dry_run: true });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.dry_run).toBe(true);
    expect(parsed.preview.imageUrl).toBe("https://example.com/cover.jpg");
    expect(result.isError).toBeUndefined();
  });

  it("rejects unsupported content-type", async () => {
    const handler = await getUploadHandler();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "image/gif" },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
    }));
    const result = await handler({ imageUrl: "https://example.com/image.gif", dry_run: false, confirm: true });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unsupported image type");
    vi.restoreAllMocks();
  });

  it("rejects image exceeding 10 MB", async () => {
    const handler = await getUploadHandler();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "image/jpeg" },
      arrayBuffer: () => Promise.resolve(Buffer.alloc(11 * 1024 * 1024)),
    }));
    const result = await handler({ imageUrl: "https://example.com/large.jpg", dry_run: false, confirm: true });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Image too large");
    vi.restoreAllMocks();
  });

  it("returns error when URL fetch fails", async () => {
    const handler = await getUploadHandler();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    }));
    const result = await handler({ imageUrl: "https://example.com/missing.jpg", dry_run: false, confirm: true });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to download");
    expect(result.content[0].text).toContain("404");
    vi.restoreAllMocks();
  });
});

describe("upload_course_images: fileBase64 mode", () => {
  it("dry_run returns preview", async () => {
    const handler = await getUploadHandler();
    const result = await handler({ fileBase64: "iVBORw0KGgo=", dry_run: true });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.dry_run).toBe(true);
    expect(result.isError).toBeUndefined();
  });

  it("rejects invalid mimeType", async () => {
    const handler = await getUploadHandler();
    const result = await handler({ fileBase64: "iVBORw0KGgo=", mimeType: "image/gif" as any, dry_run: false, confirm: true });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unsupported mimeType");
  });
});

describe("upload_course_images: dataUri mode", () => {
  it("dry_run returns preview", async () => {
    const handler = await getUploadHandler();
    const result = await handler({ dataUri: "data:image/png;base64,iVBORw0KGgo=", dry_run: true });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.dry_run).toBe(true);
    expect(result.isError).toBeUndefined();
  });

  it("rejects invalid dataUri format", async () => {
    const handler = await getUploadHandler();
    const result = await handler({ dataUri: "data:text/plain;base64,abc", dry_run: false, confirm: true });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid dataUri format");
  });
});

describe("upload_course_images: filePaths ENOENT on remote", () => {
  it("returns actionable error for missing local file", async () => {
    const handler = await getUploadHandler();
    vi.stubGlobal("fetch", vi.fn());
    const result = await handler({
      filePaths: ["C:\\Users\\agent\\Desktop\\cover.jpg"],
      dry_run: false,
      confirm: true,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("remote MCP server cannot access local file path");
    expect(result.content[0].text).toContain("imageUrl");
    expect(result.content[0].text).toContain("fileBase64");
    expect(result.content[0].text).toContain("coverImageFileId+coverImageThumbnailFileId");
    vi.restoreAllMocks();
  });
});

describe("upload_course_images: confirm required", () => {
  it("returns error when confirm missing for real upload", async () => {
    const handler = await getUploadHandler();
    const result = await handler({ imageUrl: "https://example.com/cover.jpg", dry_run: false });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("confirm=true required");
  });
});

describe("prepare_course_import: image upload guidance", () => {
  it("includes imageUploadGuidance when no image IDs provided", async () => {
    const handler = await getPrepareHandler();
    const result = await handler({
      name: "Test Course",
      stages: [{ name: "Intro", type: "Common" }],
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.imageUploadGuidance.required).toBe(true);
    expect(parsed.imageUploadGuidance.remoteMcpNote).toContain("Remote MCP");
    expect(parsed.imageUploadGuidance.acceptedModes).toContain("imageUrl");
    expect(parsed.imageUploadGuidance.acceptedModes).toContain("fileBase64");
    expect(parsed.imageUploadGuidance.acceptedModes).toContain("dataUri");
  });

  it("skips upload guidance when image IDs provided", async () => {
    const handler = await getPrepareHandler();
    const result = await handler({
      name: "Test Course",
      coverImageFileId: 100,
      coverImageThumbnailFileId: 200,
      stages: [{ name: "Intro", type: "Common" }],
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.imageUploadGuidance.required).toBe(false);
    expect(parsed.imageUploadGuidance.note).toContain("No upload needed");
  });
});

describe("import_course_structure: dry_run recommendation", () => {
  async function getImportHandler() {
    const { registerCourseTools } = await import("./courses");
    const mockServer = { tool: vi.fn() };
  registerCourseTools(mockServer as any, MOCK_CREDENTIALS, createToolError);
  const call = (mockServer.tool.mock.calls as any[]).find(
    (c: any[]) => c[0] === "eventicious_import_course_structure"
    );
    return call?.[3] as Function;
  }

  it("returns recommendation when payload is incomplete", async () => {
    const handler = await getImportHandler();
    const result = await handler({
      name: "Minimal Course",
      coverImageFileId: 100,
      coverImageThumbnailFileId: 200,
      settings: {},
      stages: [{ name: "Stage", type: "Common" }],
      dry_run: true,
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.dry_run).toBe(true);
    expect(parsed.recommendation).toContain("incomplete");
    expect(parsed.recommendation).toContain("HTTP 500");
    expect(parsed.warnings.length).toBeGreaterThan(0);
  });

  it("does NOT recommend when payload is complete", async () => {
    const handler = await getImportHandler();
    const result = await handler({
      name: "Full Course",
      description: "A complete course",
      externalId: "full-001",
      coverImageFileId: 100,
      coverImageThumbnailFileId: 200,
      settings: {
        progress: { isEnabled: true, hintText: "Progress" },
        finalScreen: { isEnabled: true, title: "Done", text: "Completed" },
        deadline: {
          isEnabled: true,
          fixedDeadlineDate: "2026-12-31",
          notificationSettings: {
            isEnabled: true,
            sendingPeriods: [{ unit: "Months", value: 1 }],
          },
        },
        isFreeOrderAllowed: true,
      },
      stages: [{
        name: "Theory",
        type: "Common",
        settings: {
          transition: { conditionType: "CheckInformation" },
          finalMessage: { isEnabled: true, title: "Done" },
        },
      }],
      dry_run: true,
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.dry_run).toBe(true);
    expect(parsed.recommendation).toBeUndefined();
  });
});
