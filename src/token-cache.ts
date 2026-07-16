import { createHash } from "crypto";
import { config } from "./config";

interface CachedToken {
  token: string;
  expiresAt: number;
}

const cache = new Map<string, CachedToken>();

function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function cacheKey(clientId: string, clientSecret: string, baseUrl: string): string {
  return `${clientId}::${hashSecret(clientSecret)}::${baseUrl}`;
}

export function getCachedToken(
  clientId: string,
  clientSecret: string,
  baseUrl: string
): string | null {
  const key = cacheKey(clientId, clientSecret, baseUrl);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.token;
}

export function setCachedToken(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  token: string
): void {
  const key = cacheKey(clientId, clientSecret, baseUrl);
  cache.set(key, {
    token,
    expiresAt: Date.now() + config.tokenCacheTtlMs,
  });
}
