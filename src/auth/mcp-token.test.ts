import { describe, it, expect } from "vitest";
import {
  issueMcpToken,
  verifyMcpToken,
  decryptMcpToken,
  validateTokenPayload,
  validateEncryptionKey,
} from "./mcp-token";

describe("mcp-token crypto utility", () => {
  const testKey = "a".repeat(64);

  describe("validateEncryptionKey", () => {
    const originalKey = process.env.MCP_TOKEN_ENCRYPTION_KEY;

    it("returns true when MCP_TOKEN_ENCRYPTION_KEY is valid 64-char hex", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      expect(validateEncryptionKey()).toBe(true);
    });

    it("returns false when MCP_TOKEN_ENCRYPTION_KEY is missing", () => {
      delete process.env.MCP_TOKEN_ENCRYPTION_KEY;
      expect(validateEncryptionKey()).toBe(false);
    });

    it("returns false when MCP_TOKEN_ENCRYPTION_KEY is wrong length", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = "short";
      expect(validateEncryptionKey()).toBe(false);
    });

    process.env.MCP_TOKEN_ENCRYPTION_KEY = originalKey || "";
  });

  describe("issueMcpToken", () => {
    it("issues token with correct prefix", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      const result = issueMcpToken({
        baseUrl: "https://api.example.ru",
        clientId: "test-client",
        clientSecret: "test-secret",
      });
      expect(typeof result).toBe("string");
      if (typeof result === "string") {
        expect(result.startsWith("mcp_evt_")).toBe(true);
      }
    });

    it("uses default TTL of 180 days", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      const result = issueMcpToken({
        baseUrl: "https://api.example.ru",
        clientId: "test-client",
        clientSecret: "test-secret",
      });
      expect(typeof result).toBe("string");
      if (typeof result === "string") {
        const payload = decryptMcpToken(result);
        expect(payload).not.toBeNull();
        if (payload) {
          const createdAt = new Date(payload.createdAt).getTime();
          const expiresAt = new Date(payload.expiresAt).getTime();
          const diffDays = (expiresAt - createdAt) / (1000 * 60 * 60 * 24);
          expect(diffDays).toBeGreaterThanOrEqual(179);
          expect(diffDays).toBeLessThanOrEqual(181);
        }
      }
    });

    it("uses custom TTL when specified", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      const result = issueMcpToken(
        { baseUrl: "https://api.example.ru", clientId: "test-client", clientSecret: "test-secret" },
        { ttlDays: 7 }
      );
      expect(typeof result).toBe("string");
      if (typeof result === "string") {
        const payload = decryptMcpToken(result);
        expect(payload).not.toBeNull();
        if (payload) {
          const createdAt = new Date(payload.createdAt).getTime();
          const expiresAt = new Date(payload.expiresAt).getTime();
          const diffDays = (expiresAt - createdAt) / (1000 * 60 * 60 * 24);
          expect(diffDays).toBeGreaterThanOrEqual(6);
          expect(diffDays).toBeLessThanOrEqual(8);
        }
      }
    });

    it("uses MCP_TOKEN_TTL_DAYS env var when set", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      const origTtl = process.env.MCP_TOKEN_TTL_DAYS;
      process.env.MCP_TOKEN_TTL_DAYS = "90";
      const result = issueMcpToken({
        baseUrl: "https://api.example.ru",
        clientId: "test-client",
        clientSecret: "test-secret",
      });
      expect(typeof result).toBe("string");
      if (typeof result === "string") {
        const payload = decryptMcpToken(result);
        expect(payload).not.toBeNull();
        if (payload) {
          const createdAt = new Date(payload.createdAt).getTime();
          const expiresAt = new Date(payload.expiresAt).getTime();
          const diffDays = (expiresAt - createdAt) / (1000 * 60 * 60 * 24);
          expect(diffDays).toBeGreaterThanOrEqual(89);
          expect(diffDays).toBeLessThanOrEqual(91);
        }
      }
      if (origTtl === undefined) {
        delete process.env.MCP_TOKEN_TTL_DAYS;
      } else {
        process.env.MCP_TOKEN_TTL_DAYS = origTtl;
      }
    });

    it("returns error when encryption key missing", () => {
      delete process.env.MCP_TOKEN_ENCRYPTION_KEY;
      const result = issueMcpToken({
        baseUrl: "https://api.example.ru",
        clientId: "test-client",
        clientSecret: "test-secret",
      });
      expect(result).toHaveProperty("error", "invalid_encryption_key");
    });
  });

  describe("verifyMcpToken", () => {
    it("issues and verifies token successfully", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      const token = issueMcpToken({
        baseUrl: "https://api.example.ru",
        clientId: "test-client",
        clientSecret: "test-secret",
      });
      expect(typeof token).toBe("string");

      const result = verifyMcpToken(token as string);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.payload.baseUrl).toBe("https://api.example.ru");
        expect(result.payload.clientId).toBe("test-client");
        expect(result.payload.clientSecret).toBe("test-secret");
        expect(result.payload.issuer).toBe("eventicious-mcp-remote");
        expect(result.payload.version).toBe("1.0.0");
      }
    });

    it("rejects malformed token without prefix", () => {
      const result = verifyMcpToken("invalid");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("malformed_token");
      }
    });

    it("rejects empty token", () => {
      const result = verifyMcpToken("");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("invalid_token");
      }
    });
  });

  describe("decryptMcpToken", () => {
    it("decrypts valid token", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      const token = issueMcpToken({
        baseUrl: "https://api.decrypted.ru",
        clientId: "decrypted-client",
        clientSecret: "decrypted-secret",
      });
      const payload = decryptMcpToken(token as string);
      expect(payload).not.toBeNull();
      if (payload) {
        expect(payload.baseUrl).toBe("https://api.decrypted.ru");
        expect(payload.clientId).toBe("decrypted-client");
        expect(payload.clientSecret).toBe("decrypted-secret");
      }
    });

    it("returns null for invalid token", () => {
      const payload = decryptMcpToken("not-a-valid-token");
      expect(payload).toBeNull();
    });
  });

  describe("validateTokenPayload", () => {
    it("validates complete payload", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      const token = issueMcpToken({
        baseUrl: "https://api.example.ru",
        clientId: "test-client",
        clientSecret: "test-secret",
      });
      const payload = decryptMcpToken(token as string);
      expect(payload).not.toBeNull();
      if (payload) {
        const result = validateTokenPayload(payload);
        expect(result.ok).toBe(true);
      }
    });

    it("rejects missing baseUrl", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      const token = issueMcpToken({
        baseUrl: "https://api.example.ru",
        clientId: "test-client",
        clientSecret: "test-secret",
      });
      const payload = decryptMcpToken(token as string);
      const modifiedPayload = { ...payload, baseUrl: "" } as any;
      const result = validateTokenPayload(modifiedPayload);
      expect(result.ok).toBe(false);
    });

    it("rejects missing clientId", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      const token = issueMcpToken({
        baseUrl: "https://api.example.ru",
        clientId: "test-client",
        clientSecret: "test-secret",
      });
      const payload = decryptMcpToken(token as string);
      const modifiedPayload = { ...payload, clientId: "" } as any;
      const result = validateTokenPayload(modifiedPayload);
      expect(result.ok).toBe(false);
    });

    it("rejects missing clientSecret", () => {
      process.env.MCP_TOKEN_ENCRYPTION_KEY = testKey;
      const token = issueMcpToken({
        baseUrl: "https://api.example.ru",
        clientId: "test-client",
        clientSecret: "test-secret",
      });
      const payload = decryptMcpToken(token as string);
      const modifiedPayload = { ...payload, clientSecret: "" } as any;
      const result = validateTokenPayload(modifiedPayload);
      expect(result.ok).toBe(false);
    });
  });
});