import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { logger } from "../logger";

const TOKEN_PREFIX = "mcp_evt_";

interface McpTokenPayload {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  createdAt: string;
  expiresAt: string;
  issuer: string;
  version: string;
}

type TokenError =
  | "invalid_token"
  | "expired_token"
  | "invalid_issuer"
  | "invalid_encryption_key"
  | "malformed_token";

interface TokenResult {
  ok: true;
  payload: McpTokenPayload;
}

interface ErrorResult {
  ok: false;
  error: TokenError;
}

function getEncryptionKey(): Buffer | null {
  const keyHex = process.env.MCP_TOKEN_ENCRYPTION_KEY?.trim();
  if (!keyHex || keyHex.length !== 64) {
    return null;
  }
  if (!/^[a-f0-9]{64}$/i.test(keyHex)) {
    return null;
  }
  try {
    return Buffer.from(keyHex, "hex");
  } catch {
    return null;
  }
}

export function validateEncryptionKey(): boolean {
  return getEncryptionKey() !== null;
}

export function issueMcpToken(
  input: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
  },
  options?: {
    issuer?: string;
    ttlDays?: number;
  }
): string | ErrorResult {
  const key = getEncryptionKey();
  if (!key) {
    logger.warn("mcp_token_issue_failed", { reason: "invalid_encryption_key" });
    return { ok: false, error: "invalid_encryption_key" };
  }

  const ttlDays = options?.ttlDays ?? parseInt(process.env.MCP_TOKEN_TTL_DAYS || "30", 10);
  const issuer = options?.issuer ?? process.env.MCP_TOKEN_ISSUER ?? "eventicious-mcp-remote";

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  const payload: McpTokenPayload = {
    baseUrl: input.baseUrl,
    clientId: input.clientId,
    clientSecret: input.clientSecret,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    issuer,
    version: "0.6.3",
  };

  try {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const plaintext = JSON.stringify(payload);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const tokenBuffer = Buffer.concat([iv, encrypted, authTag]);
    const tokenBase64 = tokenBuffer.toString("base64url");

    return `${TOKEN_PREFIX}${tokenBase64}`;
  } catch (e) {
    logger.error("mcp_token_issue_failed", { error: e instanceof Error ? e.message : "unknown" });
    return { ok: false, error: "invalid_encryption_key" };
  }
}

export function verifyMcpToken(token: string): TokenResult | ErrorResult {
  if (!token) {
    return { ok: false, error: "invalid_token" };
  }

  if (!token.startsWith(TOKEN_PREFIX)) {
    return { ok: false, error: "malformed_token" };
  }

  const key = getEncryptionKey();
  if (!key) {
    return { ok: false, error: "invalid_encryption_key" };
  }

  const tokenBase64 = token.slice(TOKEN_PREFIX.length);
  if (!tokenBase64) {
    return { ok: false, error: "invalid_token" };
  }

  try {
    const tokenBuffer = Buffer.from(tokenBase64, "base64url");
    const iv = tokenBuffer.subarray(0, 16);
    const authTag = tokenBuffer.subarray(tokenBuffer.length - 16);
    const encrypted = tokenBuffer.subarray(16, tokenBuffer.length - 16);

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");

    const payload = JSON.parse(decrypted) as McpTokenPayload;

    const now = new Date();
    if (new Date(payload.expiresAt) < now) {
      return { ok: false, error: "expired_token" };
    }

    const expectedIssuer = process.env.MCP_TOKEN_ISSUER ?? "eventicious-mcp-remote";
    if (payload.issuer !== expectedIssuer) {
      return { ok: false, error: "invalid_issuer" };
    }

    if (payload.version !== "0.6.3") {
      return { ok: false, error: "invalid_token" };
    }

    return { ok: true, payload };
  } catch {
    return { ok: false, error: "invalid_token" };
  }
}

export function decryptMcpToken(token: string): McpTokenPayload | null {
  const result = verifyMcpToken(token);
  if (!result.ok) {
    return null;
  }
  return result.payload;
}

export function validateTokenPayload(payload: McpTokenPayload): { ok: true } | { ok: false; error: string } {
  if (!payload.baseUrl) {
    return { ok: false, error: "Missing baseUrl" };
  }
  if (!payload.clientId) {
    return { ok: false, error: "Missing clientId" };
  }
  if (!payload.clientSecret) {
    return { ok: false, error: "Missing clientSecret" };
  }
  if (!payload.expiresAt) {
    return { ok: false, error: "Missing expiresAt" };
  }
  return { ok: true };
}