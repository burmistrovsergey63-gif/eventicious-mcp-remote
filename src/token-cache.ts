import { config } from "./config";

interface CachedToken {
  token: string;
  expiresAt: number;
}

const cache = new Map<string, CachedToken>();

function cacheKey(clientId: string, baseUrl: string): string {
  return `${clientId}::${baseUrl}`;
}

export function getCachedToken(
  clientId: string,
  baseUrl: string
): string | null {
  const key = cacheKey(clientId, baseUrl);
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
  baseUrl: string,
  token: string
): void {
  const key = cacheKey(clientId, baseUrl);
  cache.set(key, {
    token,
    expiresAt: Date.now() + config.tokenCacheTtlMs,
  });
}
