import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHash } from "crypto";
import {
  extractAuthContext,
  extractEventiciousCredentials,
  validateEventiciousCredentials,
  fingerprint,
  normalizeBaseUrl,
  validateCourseOperation,
  MISSING_EVENT_ID_ERROR,
} from "../auth";
import { issueMcpToken, verifyMcpToken } from "./mcp-token";

const TEST_ENCRYPTION_KEY = "a".repeat(64);

function makeMcpToken(overrides: {
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
  eventId?: string;
} = {}): string {
  const result = issueMcpToken(
    {
      baseUrl: overrides.baseUrl || "https://api-a.eventicious.ru",
      clientId: overrides.clientId || "client-a",
      clientSecret: overrides.clientSecret || "secret-a",
    },
    {
      issuer: "eventicious-mcp-remote",
      requestInfo: overrides.eventId
        ? {
            eventId: overrides.eventId,
            applicationId: "0",
            languageId: "1",
            appLanguageId: "0",
          }
        : undefined,
    }
  );
  if (typeof result === "object" && "error" in result) {
    throw new Error(`Token issue failed: ${result.error}`);
  }
  return result;
}

function makeBearerRequest(token: string, legacyHeaders?: Record<string, string>): Request {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (legacyHeaders) {
    Object.assign(headers, legacyHeaders);
  }
  return new Request("http://localhost/mcp", { method: "POST", headers });
}

function makeLayeroFallbackRequest(token: string): Request {
  return new Request("http://localhost/mcp", {
    method: "POST",
    headers: {
      "X-MCP-Authorization": `Bearer ${token}`,
    },
  });
}

function makeLegacyRequest(headers: Record<string, string>): Request {
  return new Request("http://localhost/mcp", { method: "POST", headers });
}

describe("Auth isolation", () => {
  beforeEach(() => {
    process.env.MCP_TOKEN_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    process.env.MCP_TOKEN_ISSUER = "eventicious-mcp-remote";
    process.env.MCP_ACCESS_TOKEN = "static-token";
  });

  describe("Token A -> credentials A", () => {
    it("extracts correct credentials from token A", () => {
      const token = makeMcpToken({
        clientId: "client-A",
        clientSecret: "secret-A",
        baseUrl: "https://api-a.eventicious.ru",
      });

      const result = extractAuthContext(makeBearerRequest(token));

      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.credentials.clientId).toBe("client-A");
        expect(result.credentials.clientSecret).toBe("secret-A");
        expect(result.credentials.baseUrl).toBe("https://api-a.eventicious.ru");
        expect(result.credentialSource).toBe("bearer_mcp_token");
      }
    });

    it("accepts the Layero-safe MCP authorization fallback header", () => {
      const token = makeMcpToken({
        clientId: "client-layero",
        clientSecret: "secret-layero",
      });

      const result = extractAuthContext(makeLayeroFallbackRequest(token));

      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.credentials.clientId).toBe("client-layero");
        expect(result.credentials.clientSecret).toBe("secret-layero");
        expect(result.credentialSource).toBe("bearer_mcp_token");
      }
    });
  });

  describe("Token B -> credentials B", () => {
    it("extracts correct credentials from token B", () => {
      const token = makeMcpToken({
        clientId: "client-B",
        clientSecret: "secret-B",
        baseUrl: "https://api-b.eventicious.ru",
      });

      const result = extractAuthContext(makeBearerRequest(token));

      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.credentials.clientId).toBe("client-B");
        expect(result.credentials.clientSecret).toBe("secret-B");
        expect(result.credentials.baseUrl).toBe("https://api-b.eventicious.ru");
        expect(result.credentialSource).toBe("bearer_mcp_token");
      }
    });
  });

  describe("Sequential A -> B -> A does not mix credentials", () => {
    it("returns correct credentials for each token in sequence", () => {
      const tokenA = makeMcpToken({
        clientId: "client-A",
        clientSecret: "secret-A",
        baseUrl: "https://api-a.eventicious.ru",
      });
      const tokenB = makeMcpToken({
        clientId: "client-B",
        clientSecret: "secret-B",
        baseUrl: "https://api-b.eventicious.ru",
      });

      // Request with token A
      const resultA1 = extractAuthContext(makeBearerRequest(tokenA));
      expect("error" in resultA1).toBe(false);
      if (!("error" in resultA1)) {
        expect(resultA1.credentials.clientId).toBe("client-A");
        expect(resultA1.credentials.baseUrl).toBe("https://api-a.eventicious.ru");
      }

      // Request with token B
      const resultB = extractAuthContext(makeBearerRequest(tokenB));
      expect("error" in resultB).toBe(false);
      if (!("error" in resultB)) {
        expect(resultB.credentials.clientId).toBe("client-B");
        expect(resultB.credentials.baseUrl).toBe("https://api-b.eventicious.ru");
      }

      // Request with token A again
      const resultA2 = extractAuthContext(makeBearerRequest(tokenA));
      expect("error" in resultA2).toBe(false);
      if (!("error" in resultA2)) {
        expect(resultA2.credentials.clientId).toBe("client-A");
        expect(resultA2.credentials.baseUrl).toBe("https://api-a.eventicious.ru");
      }
    });
  });

  describe("Parallel A and B do not mix credentials", () => {
    it("concurrent extractions return isolated credentials", () => {
      const tokenA = makeMcpToken({
        clientId: "client-A",
        clientSecret: "secret-A",
        baseUrl: "https://api-a.eventicious.ru",
      });
      const tokenB = makeMcpToken({
        clientId: "client-B",
        clientSecret: "secret-B",
        baseUrl: "https://api-b.eventicious.ru",
      });

      // Simulate parallel: extract from both tokens multiple times
      const results: Array<{ clientId: string; baseUrl: string }> = [];
      for (let i = 0; i < 10; i++) {
        const rA = extractAuthContext(makeBearerRequest(tokenA));
        const rB = extractAuthContext(makeBearerRequest(tokenB));
        if (!("error" in rA) && !("error" in rB)) {
          results.push(
            { clientId: rA.credentials.clientId, baseUrl: rA.credentials.baseUrl },
            { clientId: rB.credentials.clientId, baseUrl: rB.credentials.baseUrl }
          );
        }
      }

      // All A results should have A credentials
      for (let i = 0; i < results.length; i += 2) {
        expect(results[i].clientId).toBe("client-A");
        expect(results[i].baseUrl).toBe("https://api-a.eventicious.ru");
      }
      // All B results should have B credentials
      for (let i = 1; i < results.length; i += 2) {
        expect(results[i].clientId).toBe("client-B");
        expect(results[i].baseUrl).toBe("https://api-b.eventicious.ru");
      }
    });
  });

  describe("Different eventId preserved in token", () => {
    it("extracts eventId from token A", () => {
      const token = makeMcpToken({
        clientId: "client-A",
        eventId: "1187",
      });

      const result = extractAuthContext(makeBearerRequest(token));
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.requestContext?.eventId).toBe("1187");
      }
    });

    it("extracts different eventId from token B", () => {
      const token = makeMcpToken({
        clientId: "client-B",
        eventId: "9999",
      });

      const result = extractAuthContext(makeBearerRequest(token));
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.requestContext?.eventId).toBe("9999");
      }
    });

    it("sequential tokens preserve distinct eventIds", () => {
      const tokenA = makeMcpToken({ clientId: "A", eventId: "100" });
      const tokenB = makeMcpToken({ clientId: "B", eventId: "200" });

      const rA = extractAuthContext(makeBearerRequest(tokenA));
      const rB = extractAuthContext(makeBearerRequest(tokenB));

      expect("error" in rA).toBe(false);
      expect("error" in rB).toBe(false);
      if (!("error" in rA) && !("error" in rB)) {
        expect(rA.requestContext?.eventId).toBe("100");
        expect(rB.requestContext?.eventId).toBe("200");
      }
    });
  });

  describe("Bearer + legacy headers rejected", () => {
    it("returns conflicting_auth_sources when both present", () => {
      const token = makeMcpToken({
        clientId: "client-A",
        clientSecret: "secret-A",
      });

      const result = extractAuthContext(
        makeBearerRequest(token, {
          "x-eventicious-client-id": "legacy-client",
          "x-eventicious-client-secret": "legacy-secret",
        })
      );

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.code).toBe("conflicting_auth_sources");
        expect(result.error).toContain("Conflicting auth sources");
      }
    });

    it("returns conflicting_auth_sources with base-url header too", () => {
      const token = makeMcpToken({
        clientId: "client-A",
        clientSecret: "secret-A",
      });

      const result = extractAuthContext(
        makeBearerRequest(token, {
          "x-eventicious-base-url": "https://other.eventicious.ru",
        })
      );

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.code).toBe("conflicting_auth_sources");
      }
    });

    it("returns conflicting_auth_sources with any single legacy header", () => {
      const token = makeMcpToken({
        clientId: "client-A",
        clientSecret: "secret-A",
      });

      // Only client-id header
      const result1 = extractAuthContext(
        makeBearerRequest(token, {
          "x-eventicious-client-id": "legacy-client",
        })
      );
      expect("error" in result1).toBe(true);

      // Only client-secret header
      const result2 = extractAuthContext(
        makeBearerRequest(token, {
          "x-eventicious-client-secret": "legacy-secret",
        })
      );
      expect("error" in result2).toBe(true);
    });
  });

  describe("process.env does not override Bearer claims", () => {
    it("uses token credentials, not env defaults", () => {
      process.env.EVENTICIOUS_DEFAULT_BASE_URL = "https://env-default.eventicious.ru";

      const token = makeMcpToken({
        clientId: "token-client",
        clientSecret: "token-secret",
        baseUrl: "https://token-base.eventicious.ru",
      });

      const result = extractAuthContext(makeBearerRequest(token));
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.credentials.baseUrl).toBe("https://token-base.eventicious.ru");
        expect(result.credentials.clientId).toBe("token-client");
        expect(result.credentials.clientSecret).toBe("token-secret");
      }
    });
  });

  describe("Legacy headers work when no Bearer token", () => {
    it("extracts from legacy headers", () => {
      const result = extractAuthContext(
        makeLegacyRequest({
          "x-eventicious-client-id": "legacy-client",
          "x-eventicious-client-secret": "legacy-secret",
          "x-eventicious-base-url": "https://legacy.eventicious.ru",
        })
      );

      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.credentials.clientId).toBe("legacy-client");
        expect(result.credentials.clientSecret).toBe("legacy-secret");
        expect(result.credentials.baseUrl).toBe("https://legacy.eventicious.ru");
        expect(result.credentialSource).toBe("legacy_headers");
        expect(result.requestContext).toBeNull();
      }
    });
  });

  describe("extractEventiciousCredentials backward compatibility", () => {
    it("works with Bearer token", () => {
      const token = makeMcpToken({
        clientId: "compat-client",
        clientSecret: "compat-secret",
        baseUrl: "https://compat.eventicious.ru",
      });

      const creds = extractEventiciousCredentials(makeBearerRequest(token));
      expect(creds.clientId).toBe("compat-client");
      expect(creds.clientSecret).toBe("compat-secret");
      expect(creds.baseUrl).toBe("https://compat.eventicious.ru");
    });

    it("works with legacy headers", () => {
      const creds = extractEventiciousCredentials(
        makeLegacyRequest({
          "x-eventicious-client-id": "legacy-compat",
          "x-eventicious-client-secret": "legacy-secret-compat",
        })
      );
      expect(creds.clientId).toBe("legacy-compat");
      expect(creds.clientSecret).toBe("legacy-secret-compat");
    });
  });

  describe("fingerprint utility", () => {
    it("returns 12-char hex string", () => {
      const fp = fingerprint("test-value");
      expect(fp).toHaveLength(12);
      expect(/^[a-f0-9]{12}$/.test(fp)).toBe(true);
    });

    it("is deterministic", () => {
      expect(fingerprint("same-input")).toBe(fingerprint("same-input"));
    });

    it("produces different fingerprints for different inputs", () => {
      expect(fingerprint("input-A")).not.toBe(fingerprint("input-B"));
    });
  });

  describe("validateCourseOperation", () => {
    it("rejects when eventId missing", () => {
      const result = validateCourseOperation(
        { eventId: "", applicationId: "0", languageId: "1", appLanguageId: "0" },
        undefined
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(MISSING_EVENT_ID_ERROR);
      }
    });

    it("accepts when eventId present in context", () => {
      const result = validateCourseOperation(
        { eventId: "123", applicationId: "0", languageId: "1", appLanguageId: "0" },
        undefined
      );
      expect(result.ok).toBe(true);
    });

    it("accepts when eventId in tool args", () => {
      const result = validateCourseOperation(undefined, "456");
      expect(result.ok).toBe(true);
    });
  });

  describe("Exchange-to-request-context full chain", () => {
    it("Token A: credentials A + eventId A extracted correctly", () => {
      const token = issueMcpToken(
        {
          baseUrl: "https://api-a.eventicious.ru",
          clientId: "exchange-client-A",
          clientSecret: "exchange-secret-A",
        },
        {
          issuer: "eventicious-mcp-remote",
          requestInfo: {
            eventId: "123",
            applicationId: "0",
            languageId: "1",
            appLanguageId: "0",
          },
          acceptLanguage: "ru",
        }
      );
      expect(typeof token).toBe("string");

      const ctx = extractAuthContext(makeBearerRequest(token as string));
      expect("error" in ctx).toBe(false);
      if (!("error" in ctx)) {
        expect(ctx.credentials.clientId).toBe("exchange-client-A");
        expect(ctx.credentials.clientSecret).toBe("exchange-secret-A");
        expect(ctx.credentials.baseUrl).toBe("https://api-a.eventicious.ru");
        expect(ctx.requestContext?.eventId).toBe("123");
        expect(ctx.requestContext?.applicationId).toBe("0");
        expect(ctx.requestContext?.languageId).toBe("1");
        expect(ctx.requestContext?.appLanguageId).toBe("0");
        expect(ctx.requestContext?.acceptLanguage).toBe("ru");
        expect(ctx.credentialSource).toBe("bearer_mcp_token");
      }
    });

    it("Token B: credentials B + eventId B extracted correctly", () => {
      const token = issueMcpToken(
        {
          baseUrl: "https://api-b.eventicious.ru",
          clientId: "exchange-client-B",
          clientSecret: "exchange-secret-B",
        },
        {
          issuer: "eventicious-mcp-remote",
          requestInfo: {
            eventId: "999",
            applicationId: "0",
            languageId: "1",
            appLanguageId: "0",
          },
          acceptLanguage: "ru",
        }
      );

      const ctx = extractAuthContext(makeBearerRequest(token as string));
      expect("error" in ctx).toBe(false);
      if (!("error" in ctx)) {
        expect(ctx.credentials.clientId).toBe("exchange-client-B");
        expect(ctx.credentials.baseUrl).toBe("https://api-b.eventicious.ru");
        expect(ctx.requestContext?.eventId).toBe("999");
      }
    });

    it("tokens have different fingerprints", () => {
      const tokenA = issueMcpToken(
        { baseUrl: "https://api-a.eventicious.ru", clientId: "A", clientSecret: "secretA" },
        { issuer: "eventicious-mcp-remote", requestInfo: { eventId: "1", applicationId: "0", languageId: "1", appLanguageId: "0" } }
      );
      const tokenB = issueMcpToken(
        { baseUrl: "https://api-b.eventicious.ru", clientId: "B", clientSecret: "secretB" },
        { issuer: "eventicious-mcp-remote", requestInfo: { eventId: "2", applicationId: "0", languageId: "1", appLanguageId: "0" } }
      );
      expect(typeof tokenA).toBe("string");
      expect(typeof tokenB).toBe("string");
      expect(tokenA).not.toBe(tokenB);
    });

    it("sequential A -> B -> A: credentials and eventId do not mix", () => {
      const tokenA = issueMcpToken(
        { baseUrl: "https://api-a.eventicious.ru", clientId: "chain-A", clientSecret: "secret-chain-A" },
        { issuer: "eventicious-mcp-remote", requestInfo: { eventId: "100", applicationId: "0", languageId: "1", appLanguageId: "0" } }
      );
      const tokenB = issueMcpToken(
        { baseUrl: "https://api-b.eventicious.ru", clientId: "chain-B", clientSecret: "secret-chain-B" },
        { issuer: "eventicious-mcp-remote", requestInfo: { eventId: "200", applicationId: "0", languageId: "1", appLanguageId: "0" } }
      );

      // A
      const r1 = extractAuthContext(makeBearerRequest(tokenA as string));
      expect("error" in r1).toBe(false);
      if (!("error" in r1)) {
        expect(r1.credentials.clientId).toBe("chain-A");
        expect(r1.requestContext?.eventId).toBe("100");
      }

      // B
      const r2 = extractAuthContext(makeBearerRequest(tokenB as string));
      expect("error" in r2).toBe(false);
      if (!("error" in r2)) {
        expect(r2.credentials.clientId).toBe("chain-B");
        expect(r2.requestContext?.eventId).toBe("200");
      }

      // A again
      const r3 = extractAuthContext(makeBearerRequest(tokenA as string));
      expect("error" in r3).toBe(false);
      if (!("error" in r3)) {
        expect(r3.credentials.clientId).toBe("chain-A");
        expect(r3.requestContext?.eventId).toBe("100");
        expect(r3.credentials.baseUrl).toBe("https://api-a.eventicious.ru");
      }
    });
  });

  describe("requestContext reaches HTTP headers", () => {
    it("eventiciousRequest serializes requestContext into EventiciousRequestInfo header", async () => {
      const { eventiciousRequest } = await import("../eventicious-client");
      const mockFetch = vi.fn().mockImplementation(async (...args: unknown[]) => {
        const url = String(args[0]);
        if (url.includes("/connect/token")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ access_token: "mock-token" }),
            text: async () => '{"access_token":"mock-token"}',
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({}),
          text: async () => "{}",
        };
      });
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch;

      try {
        await eventiciousRequest({
          method: "GET",
          endpoint: "/api/external/v2/aclgroups",
          credentials: { baseUrl: "https://api.test.ru", clientId: "c", clientSecret: "s" },
          requestContext: { eventId: "123", applicationId: "0", languageId: "1", appLanguageId: "0" },
          acceptLanguage: "ru",
        });

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const [, opts] = mockFetch.mock.calls[1];
        const headers = (opts as RequestInit).headers as Record<string, string>;

        const info = JSON.parse(headers["EventiciousRequestInfo"]);
        expect(info).toEqual({
          eventId: "123",
          applicationId: "0",
          languageId: "1",
          appLanguageId: "0",
        });
        expect(headers["Accept-Language"]).toBe("ru");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
