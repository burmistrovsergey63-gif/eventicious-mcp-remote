import { describe, it, expect, beforeEach, vi } from "vitest";
import { extractEventiciousCredentials, validateEventiciousCredentials, normalizeBaseUrl, maskSecret } from "./auth";

describe("normalizeBaseUrl", () => {
  it("removes trailing slash", () => {
    expect(normalizeBaseUrl("https://api.eventicious.ru/")).toBe("https://api.eventicious.ru");
  });

  it("removes leading/trailing quotes", () => {
    expect(normalizeBaseUrl('"https://api.eventicious.ru"')).toBe("https://api.eventicious.ru");
    expect(normalizeBaseUrl("'https://api.eventicious.ru'")).toBe("https://api.eventicious.ru");
  });

  it("trims spaces", () => {
    expect(normalizeBaseUrl("  https://api.eventicious.ru  ")).toBe("https://api.eventicious.ru");
  });

  it("removes both quotes and slashes", () => {
    expect(normalizeBaseUrl('"/api/eventicious.ru/"')).toBe("/api/eventicious.ru");
  });
});

describe("extractEventiciousCredentials", () => {
  it("extracts credentials from headers", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-eventicious-base-url": "https://api.test.com",
        "x-eventicious-client-id": "test-client",
        "x-eventicious-client-secret": "test-secret",
      },
    });
    const creds = extractEventiciousCredentials(request);
    expect(creds.baseUrl).toBe("https://api.test.com");
    expect(creds.clientId).toBe("test-client");
    expect(creds.clientSecret).toBe("test-secret");
  });

  it("uses defaultBaseUrl when headers missing", () => {
    const request = new Request("http://localhost");
    const creds = extractEventiciousCredentials(request);
    // Uses defaultBaseUrl from config when header not provided
    expect(creds.baseUrl).toBe("https://api-integration.eventicious.ru");
    expect(creds.clientId).toBe("");
    expect(creds.clientSecret).toBe("");
  });
});

describe("validateEventiciousCredentials", () => {
  it("returns ok: true when all credentials present", () => {
    const result = validateEventiciousCredentials({
      baseUrl: "https://api.test.com",
      clientId: "test-client",
      clientSecret: "test-secret",
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns error when clientId missing", () => {
    const result = validateEventiciousCredentials({
      baseUrl: "https://api.test.com",
      clientId: "",
      clientSecret: "test-secret",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("x-eventicious-client-id");
    }
  });

  it("returns error when clientSecret missing", () => {
    const result = validateEventiciousCredentials({
      baseUrl: "https://api.test.com",
      clientId: "test-client",
      clientSecret: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("x-eventicious-client-secret");
    }
  });

  it("returns error when baseUrl missing", () => {
    const result = validateEventiciousCredentials({
      baseUrl: "",
      clientId: "test-client",
      clientSecret: "test-secret",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("base URL");
    }
  });

  it("returns error when baseUrl is token endpoint", () => {
    const result = validateEventiciousCredentials({
      baseUrl: "https://api.test.com/connect/token",
      clientId: "test-client",
      clientSecret: "test-secret",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("token endpoint URL");
    }
  });
});

describe("maskSecret", () => {
  it("masks long secrets", () => {
    expect(maskSecret("abcdef123456")).toBe("abc***456");
  });

  it("masks short secrets completely", () => {
    expect(maskSecret("abc")).toBe("***");
    expect(maskSecret("")).toBe("***");
  });

  it("masks medium secrets", () => {
    expect(maskSecret("abcdefgh")).toBe("abc***fgh");
  });
});