import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eventiciousRequest } from "./eventicious-client";

function mockFetchSequence() {
  const mockFetch = vi.fn();

  mockFetch.mockImplementation(async (...args: unknown[]) => {
    const url = String(args[0]);
    if (url.includes("/connect/token")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ access_token: "mock-oauth-token-123" }),
        text: async () => '{"access_token":"mock-oauth-token-123"}',
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      text: async () => '{"success":true}',
    };
  });

  return mockFetch;
}

describe("eventiciousRequest HTTP boundary", () => {
  const originalFetch = globalThis.fetch;
  let mockFetch: ReturnType<typeof mockFetchSequence>;

  beforeEach(() => {
    mockFetch = mockFetchSequence();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends EventiciousRequestInfo header with correct JSON structure", async () => {
    await eventiciousRequest({
      method: "GET",
      endpoint: "/api/external/v2/catalogs",
      credentials: { baseUrl: "https://api.eventicious.ru", clientId: "test-a", clientSecret: "secret-a" },
      requestContext: {
        eventId: "123",
        applicationId: "0",
        languageId: "1",
        appLanguageId: "0",
      },
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, apiOpts] = mockFetch.mock.calls[1];
    const headers = (apiOpts as RequestInit).headers as Record<string, string>;

    expect(headers["EventiciousRequestInfo"]).toBeDefined();
    const parsed = JSON.parse(headers["EventiciousRequestInfo"]);
    expect(parsed).toEqual({
      eventId: "123",
      applicationId: "0",
      languageId: "1",
      appLanguageId: "0",
    });
  });

  it("sends Accept-Language header when acceptLanguage provided", async () => {
    await eventiciousRequest({
      method: "GET",
      endpoint: "/api/external/v2/catalogs",
      credentials: { baseUrl: "https://api.eventicious.ru", clientId: "test-b", clientSecret: "secret-b" },
      requestContext: {
        eventId: "123",
        applicationId: "0",
        languageId: "1",
        appLanguageId: "0",
      },
      acceptLanguage: "ru",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, apiOpts] = mockFetch.mock.calls[1];
    const headers = (apiOpts as RequestInit).headers as Record<string, string>;
    expect(headers["Accept-Language"]).toBe("ru");
  });

  it("omits EventiciousRequestInfo when requestContext is undefined", async () => {
    await eventiciousRequest({
      method: "GET",
      endpoint: "/api/external/v2/catalogs",
      credentials: { baseUrl: "https://api.eventicious.ru", clientId: "test-c", clientSecret: "secret-c" },
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, apiOpts] = mockFetch.mock.calls[1];
    const headers = (apiOpts as RequestInit).headers as Record<string, string>;
    expect(headers["EventiciousRequestInfo"]).toBeUndefined();
  });

  it("omits Accept-Language when acceptLanguage is undefined", async () => {
    await eventiciousRequest({
      method: "GET",
      endpoint: "/api/external/v2/catalogs",
      credentials: { baseUrl: "https://api.eventicious.ru", clientId: "test-d", clientSecret: "secret-d" },
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, apiOpts] = mockFetch.mock.calls[1];
    const headers = (apiOpts as RequestInit).headers as Record<string, string>;
    expect(headers["Accept-Language"]).toBeUndefined();
  });

  it("sends both headers for POST with body", async () => {
    await eventiciousRequest({
      method: "POST",
      endpoint: "/api/external/v2/locations/create",
      body: { id: 1, name: "Room A", position: 1 },
      credentials: { baseUrl: "https://api.eventicious.ru", clientId: "test-e", clientSecret: "secret-e" },
      requestContext: {
        eventId: "456",
        applicationId: "0",
        languageId: "1",
        appLanguageId: "0",
      },
      acceptLanguage: "en",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, apiOpts] = mockFetch.mock.calls[1];
    const headers = (apiOpts as RequestInit).headers as Record<string, string>;

    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["EventiciousRequestInfo"]).toBeDefined();
    expect(headers["Accept-Language"]).toBe("en");

    const parsed = JSON.parse(headers["EventiciousRequestInfo"]);
    expect(parsed.eventId).toBe("456");
  });

  it("Authorization header uses OAuth token, not MCP token", async () => {
    await eventiciousRequest({
      method: "GET",
      endpoint: "/api/external/v2/catalogs",
      credentials: { baseUrl: "https://api.eventicious.ru", clientId: "test-f", clientSecret: "secret-f" },
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, apiOpts] = mockFetch.mock.calls[1];
    const headers = (apiOpts as RequestInit).headers as Record<string, string>;
    expect(headers["Authorization"]).toMatch(/^Bearer /);
    expect(headers["Authorization"]).not.toContain("mcp_evt_");
  });

  it("sends eventId=789 for course-related operations", async () => {
    await eventiciousRequest({
      method: "POST",
      endpoint: "/api/external/v2/courses/import",
      body: { name: "Test Course" },
      credentials: { baseUrl: "https://api.eventicious.ru", clientId: "test-g", clientSecret: "secret-g" },
      requestContext: {
        eventId: "789",
        applicationId: "0",
        languageId: "1",
        appLanguageId: "0",
      },
      acceptLanguage: "ru",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, apiOpts] = mockFetch.mock.calls[1];
    const headers = (apiOpts as RequestInit).headers as Record<string, string>;
    const parsed = JSON.parse(headers["EventiciousRequestInfo"]);
    expect(parsed.eventId).toBe("789");
    expect(headers["Accept-Language"]).toBe("ru");
  });

  it("token endpoint request does not include EventiciousRequestInfo", async () => {
    await eventiciousRequest({
      method: "GET",
      endpoint: "/api/external/v2/catalogs",
      credentials: { baseUrl: "https://api.eventicious.ru", clientId: "test-h", clientSecret: "secret-h" },
      requestContext: {
        eventId: "123",
        applicationId: "0",
        languageId: "1",
        appLanguageId: "0",
      },
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [tokenUrl, tokenOpts] = mockFetch.mock.calls[0];
    expect(String(tokenUrl)).toContain("/connect/token");
    const tokenHeaders = (tokenOpts as RequestInit).headers as Record<string, string>;
    expect(tokenHeaders["EventiciousRequestInfo"]).toBeUndefined();
  });
});
