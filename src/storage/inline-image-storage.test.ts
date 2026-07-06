import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  uploadInlineImageToImgBB,
  isPublicHttpsUrl,
  processGravityJsonForInlineImages,
  UploadInlineImageInput,
  InlineImageStorageOptions,
} from "./inline-image-storage";

const VALID_API_KEY = "test-api-key-12345";

// Minimal valid PNG (1x1 white pixel)
const VALID_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

// Minimal valid JPEG
const VALID_JPEG_BASE64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsM DQ4SEA0OEQ4LCxAWEBETFBUVFQ4PFx8WFBgSFBUU/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQU FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBL/wAARCAABAAEDASIAAhEBAxEB/8QA FAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAA AAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AaA//2Q==";

const MOCK_IMGBB_SUCCESS_RESPONSE = {
  success: true,
  status: 200,
  data: {
    url: "https://i.ibb.co/abc123/test.png",
    display_url: "https://i.ibb.co/abc123/test.png",
    image: {
      url: "https://i.ibb.co/abc123/test.png",
    },
    delete_url: "https://ibb.co/abc123/delete123",
    image_id: "img123",
    width: 100,
    height: 100,
    size: 1234,
  },
};

const MOCK_IMGBB_SUCCESS_RESPONSE_NO_IMAGE_URL = {
  success: true,
  status: 200,
  data: {
    url: "https://i.ibb.co/fallback/test.png",
    display_url: "https://i.ibb.co/fallback-display/test.png",
    delete_url: "https://ibb.co/fallback/delete",
  },
};

const MOCK_IMGBB_ERROR_RESPONSE = {
  success: false,
  status: 400,
  error: {
    message: "Invalid API key",
  },
};

describe("isPublicHttpsUrl", () => {
  it("returns true for valid HTTPS URLs", () => {
    expect(isPublicHttpsUrl("https://example.com/image.png")).toBe(true);
    expect(isPublicHttpsUrl("https://i.ibb.co/abc123/test.png")).toBe(true);
  });

  it("returns false for HTTP URLs", () => {
    expect(isPublicHttpsUrl("http://example.com/image.png")).toBe(false);
  });

  it("returns false for localhost", () => {
    expect(isPublicHttpsUrl("https://localhost/image.png")).toBe(false);
  });

  it("returns false for 127.0.0.1", () => {
    expect(isPublicHttpsUrl("https://127.0.0.1/image.png")).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(isPublicHttpsUrl("not-a-url")).toBe(false);
    expect(isPublicHttpsUrl("")).toBe(false);
  });
});

describe("uploadInlineImageToImgBB", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error when IMGBB_API_KEY is missing", async () => {
    await expect(
      uploadInlineImageToImgBB(
        { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
        { apiKey: "" }
      )
    ).rejects.toThrow("IMGBB_API_KEY is required");
  });

  it("uploads fileBase64 and returns data.image.url", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadInlineImageToImgBB(
      { fileBase64: VALID_PNG_BASE64, mimeType: "image/png", fileName: "test.png" },
      { apiKey: VALID_API_KEY }
    );

    expect(result.publicUrl).toBe("https://i.ibb.co/abc123/test.png");
    expect(result.provider).toBe("imgbb");
    expect(result.providerImageId).toBe("img123");
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.sizeBytes).toBe(1234);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to data.url when data.image.url is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE_NO_IMAGE_URL),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadInlineImageToImgBB(
      { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
      { apiKey: VALID_API_KEY }
    );

    expect(result.publicUrl).toBe("https://i.ibb.co/fallback/test.png");
  });

  it("does not use url_viewer as src", async () => {
    const responseWithViewer = {
      ...MOCK_IMGBB_SUCCESS_RESPONSE,
      data: {
        ...MOCK_IMGBB_SUCCESS_RESPONSE.data,
        url_viewer: "https://ibb.co/abc123/viewer",
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(responseWithViewer),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadInlineImageToImgBB(
      { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
      { apiKey: VALID_API_KEY }
    );

    expect(result.publicUrl).not.toContain("viewer");
    expect(result.publicUrl).toBe("https://i.ibb.co/abc123/test.png");
  });

  it("extracts base64 from dataUri", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const dataUri = `data:image/png;base64,${VALID_PNG_BASE64}`;
    const result = await uploadInlineImageToImgBB(
      { dataUri },
      { apiKey: VALID_API_KEY }
    );

    expect(result.publicUrl).toBe("https://i.ibb.co/abc123/test.png");
  });

  it("passes imageUrl directly to ImgBB", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadInlineImageToImgBB(
      { imageUrl: "https://example.com/image.png" },
      { apiKey: VALID_API_KEY }
    );

    expect(result.publicUrl).toBe("https://i.ibb.co/abc123/test.png");
    const formData = fetchMock.mock.calls[0][1].body as FormData;
    expect(formData.get("image")).toBe("https://example.com/image.png");
  });

  it("rejects SVG images", async () => {
    await expect(
      uploadInlineImageToImgBB(
        { fileBase64: "base64data", mimeType: "image/svg+xml" },
        { apiKey: VALID_API_KEY }
      )
    ).rejects.toThrow("SVG images are not allowed");
  });

  it("rejects unsupported mime types", async () => {
    await expect(
      uploadInlineImageToImgBB(
        { fileBase64: "base64data", mimeType: "image/bmp" },
        { apiKey: VALID_API_KEY }
      )
    ).rejects.toThrow("Unsupported image type");
  });

  it("rejects oversized images", async () => {
    const largeBase64 = "A".repeat(50 * 1024 * 1024); // 50 MB
    await expect(
      uploadInlineImageToImgBB(
        { fileBase64: largeBase64, mimeType: "image/png" },
        { apiKey: VALID_API_KEY, maxBytes: 32 * 1024 * 1024 }
      )
    ).rejects.toThrow("Image too large");
  });

  it("redacts delete_url", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadInlineImageToImgBB(
      { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
      { apiKey: VALID_API_KEY }
    );

    expect(result.deleteUrlRedacted).toBeDefined();
    expect(result.deleteUrlRedacted).not.toBe(MOCK_IMGBB_SUCCESS_RESPONSE.data.delete_url);
    expect(result.deleteUrlRedacted).toContain("redacted");
  });

  it("returns dry-run URL when dryRun=true", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadInlineImageToImgBB(
      { fileBase64: VALID_PNG_BASE64, mimeType: "image/png", fileName: "test.png" },
      { apiKey: VALID_API_KEY, dryRun: true }
    );

    expect(result.publicUrl).toContain("dry-run://imgbb/");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on ImgBB API error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_ERROR_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      uploadInlineImageToImgBB(
        { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
        { apiKey: VALID_API_KEY }
      )
    ).rejects.toThrow("ImgBB upload failed");
  });

  it("throws when no image source provided", async () => {
    await expect(
      uploadInlineImageToImgBB(
        {},
        { apiKey: VALID_API_KEY }
      )
    ).rejects.toThrow("No image source provided");
  });

  it("does not log IMGBB_API_KEY", async () => {
    const loggerWarn = vi.fn();
    vi.stubGlobal("logger", { warn: loggerWarn });

    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    await uploadInlineImageToImgBB(
      { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
      { apiKey: VALID_API_KEY }
    );

    // Check that the API key is not in any logged data
    const loggedCalls = loggerWarn.mock.calls.map(c => JSON.stringify(c));
    for (const call of loggedCalls) {
      expect(call).not.toContain(VALID_API_KEY);
    }
  });

  it("includes expiration when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    await uploadInlineImageToImgBB(
      { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
      { apiKey: VALID_API_KEY, expirationSeconds: 3600 }
    );

    const formData = fetchMock.mock.calls[0][1].body as FormData;
    expect(formData.get("expiration")).toBe("3600");
  });

  it("detects PNG from magic bytes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    await uploadInlineImageToImgBB(
      { fileBase64: VALID_PNG_BASE64 },
      { apiKey: VALID_API_KEY }
    );

    const formData = fetchMock.mock.calls[0][1].body as FormData;
    expect(formData.get("image")).toBe(VALID_PNG_BASE64);
  });

  it("returns source field in result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadInlineImageToImgBB(
      { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
      { apiKey: VALID_API_KEY },
      "fileBase64"
    );

    expect(result.source).toBe("fileBase64");
  });

  it("returns source=dataUri when source param is dataUri", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadInlineImageToImgBB(
      { dataUri: `data:image/png;base64,${VALID_PNG_BASE64}` },
      { apiKey: VALID_API_KEY },
      "dataUri"
    );

    expect(result.source).toBe("dataUri");
  });
});

describe("processGravityJsonForInlineImages", () => {
  const storageOptions: InlineImageStorageOptions = { apiKey: VALID_API_KEY };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns unchanged GravityJson when no image nodes", async () => {
    const gravityJson = {
      type: "doc",
      content: [{ type: "paragraph", attrs: {}, content: [{ type: "text", text: "hello" }] }],
    };
    const { result, uploads } = await processGravityJsonForInlineImages(gravityJson, storageOptions, false);
    expect(result).toEqual(gravityJson);
    expect(uploads).toEqual([]);
  });

  it("leaves attrs.src with public HTTPS URL unchanged", async () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { src: "https://i.ibb.co/abc123/test.png" },
      }],
    };
    const { result, uploads } = await processGravityJsonForInlineImages(gravityJson, storageOptions, false);
    const imageAttrs = (result.content as Array<Record<string, unknown>>)[0].attrs as Record<string, unknown>;
    expect(imageAttrs.src).toBe("https://i.ibb.co/abc123/test.png");
    expect(uploads).toEqual([]);
  });

  it("uploads attrs.src dataUri to ImgBB and replaces src", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { src: `data:image/png;base64,${VALID_PNG_BASE64}` },
      }],
    };
    const { result, uploads } = await processGravityJsonForInlineImages(gravityJson, storageOptions, false);
    const imageAttrs = (result.content as Array<Record<string, unknown>>)[0].attrs as Record<string, unknown>;
    expect(imageAttrs.src).toBe("https://i.ibb.co/abc123/test.png");
    expect(imageAttrs.dataUri).toBeUndefined();
    expect(uploads).toHaveLength(1);
    expect(uploads[0].publicUrl).toBe("https://i.ibb.co/abc123/test.png");
    expect(uploads[0].source).toBe("dataUri");
  });

  it("uploads fileBase64 to ImgBB and replaces src", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
      }],
    };
    const { result, uploads } = await processGravityJsonForInlineImages(gravityJson, storageOptions, false);
    const imageAttrs = (result.content as Array<Record<string, unknown>>)[0].attrs as Record<string, unknown>;
    expect(imageAttrs.src).toBe("https://i.ibb.co/abc123/test.png");
    expect(imageAttrs.fileBase64).toBeUndefined();
    expect(uploads).toHaveLength(1);
    expect(uploads[0].source).toBe("fileBase64");
  });

  it("maps imageUrl to src when imageUrl is public HTTPS", async () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { imageUrl: "https://i.ibb.co/abc123/test.png" },
      }],
    };
    const { result, uploads } = await processGravityJsonForInlineImages(gravityJson, storageOptions, false);
    const imageAttrs = (result.content as Array<Record<string, unknown>>)[0].attrs as Record<string, unknown>;
    expect(imageAttrs.src).toBe("https://i.ibb.co/abc123/test.png");
    expect(imageAttrs.imageUrl).toBeUndefined();
    expect(uploads).toEqual([]);
  });

  it("uploads non-public imageUrl to ImgBB", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { imageUrl: "http://example.com/image.png" },
      }],
    };
    const { result, uploads } = await processGravityJsonForInlineImages(gravityJson, storageOptions, false);
    const imageAttrs = (result.content as Array<Record<string, unknown>>)[0].attrs as Record<string, unknown>;
    expect(imageAttrs.src).toBe("https://i.ibb.co/abc123/test.png");
    expect(imageAttrs.imageUrl).toBeUndefined();
    expect(uploads).toHaveLength(1);
    expect(uploads[0].source).toBe("imageUrl");
  });

  it("rejects fileId in image attrs", async () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { fileId: "abc123" },
      }],
    };
    await expect(
      processGravityJsonForInlineImages(gravityJson, storageOptions, false)
    ).rejects.toThrow("fileId подходит для обложки курса, но не для картинки внутри текста");
  });

  it("fileBase64 is not present in final payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { fileBase64: VALID_PNG_BASE64, mimeType: "image/png", fileName: "test.png" },
      }],
    };
    const { result } = await processGravityJsonForInlineImages(gravityJson, storageOptions, false);
    const imageAttrs = (result.content as Array<Record<string, unknown>>)[0].attrs as Record<string, unknown>;
    expect(imageAttrs.fileBase64).toBeUndefined();
    expect(imageAttrs.dataUri).toBeUndefined();
  });

  it("dry_run does not call ImgBB", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { src: `data:image/png;base64,${VALID_PNG_BASE64}` },
      }],
    };
    const { result, uploads } = await processGravityJsonForInlineImages(gravityJson, storageOptions, true);
    const imageAttrs = (result.content as Array<Record<string, unknown>>)[0].attrs as Record<string, unknown>;
    expect(imageAttrs.src).toContain("dry-run://imgbb/");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(uploads).toHaveLength(1);
    expect(uploads[0].publicUrl).toContain("dry-run://imgbb/");
  });

  it("rejects SVG in src dataUri", async () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDov" },
      }],
    };
    await expect(
      processGravityJsonForInlineImages(gravityJson, storageOptions, false)
    ).rejects.toThrow("SVG images are not allowed");
  });

  it("IMGBB_API_KEY is not present in errors", async () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { src: `data:image/png;base64,${VALID_PNG_BASE64}` },
      }],
    };
    try {
      await processGravityJsonForInlineImages(gravityJson, { apiKey: "secret-key-12345" }, false);
    } catch (err) {
      expect(String(err)).not.toContain("secret-key-12345");
    }
  });

  it("processes nested image nodes recursively", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

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
    const { result, uploads } = await processGravityJsonForInlineImages(gravityJson, storageOptions, false);
    expect(uploads).toHaveLength(1);
    const docContent = result.content as Array<Record<string, unknown>>;
    const bulletList = docContent[0];
    const listItemContent = bulletList.content as Array<Record<string, unknown>>;
    const listItem = listItemContent[0];
    const paraContent = listItem.content as Array<Record<string, unknown>>;
    const paragraph = paraContent[0];
    const imgContent = paragraph.content as Array<Record<string, unknown>>;
    const imageNode = imgContent[0];
    const imageAttrs = imageNode.attrs as Record<string, unknown>;
    expect(imageAttrs.src).toBe("https://i.ibb.co/abc123/test.png");
  });

  it("processes multiple image nodes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const gravityJson = {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: `data:image/png;base64,${VALID_PNG_BASE64}` },
        },
        {
          type: "image",
          attrs: { src: `data:image/png;base64,${VALID_PNG_BASE64}` },
        },
      ],
    };
    const { uploads } = await processGravityJsonForInlineImages(gravityJson, storageOptions, false);
    expect(uploads).toHaveLength(2);
  });

  it("delete_url is not present in final GravityJson", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_IMGBB_SUCCESS_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchMock);

    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { fileBase64: VALID_PNG_BASE64, mimeType: "image/png" },
      }],
    };
    const { result } = await processGravityJsonForInlineImages(gravityJson, storageOptions, false);
    const resultStr = JSON.stringify(result);
    expect(resultStr).not.toContain("delete_url");
  });

  it("missing key gives human-friendly error mentioning public URL", async () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { src: `data:image/png;base64,${VALID_PNG_BASE64}` },
      }],
    };
    await expect(
      processGravityJsonForInlineImages(gravityJson, null, false)
    ).rejects.toThrow("публичный URL");
  });

  it("fileId error explains cover vs inline image", async () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { fileId: "abc123" },
      }],
    };
    await expect(
      processGravityJsonForInlineImages(gravityJson, storageOptions, false)
    ).rejects.toThrow("обложки курса");
  });

  it("fileId error mentions public URL as alternative", async () => {
    const gravityJson = {
      type: "doc",
      content: [{
        type: "image",
        attrs: { fileId: "abc123" },
      }],
    };
    await expect(
      processGravityJsonForInlineImages(gravityJson, storageOptions, false)
    ).rejects.toThrow("публичный URL");
  });
});
