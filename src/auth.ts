import { config } from "./config";
import { logger } from "./logger";

export function validateMcpToken(request: Request): boolean {
  if (!config.mcpAccessToken) {
    logger.warn("mcp_token_skip", { reason: "MCP_ACCESS_TOKEN not set, allowing request in dev mode" });
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    logger.warn("mcp_token_missing", { reason: "No Authorization header" });
    return false;
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token === config.mcpAccessToken;
}

export interface EventiciousCredentials {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Normalize Eventicious base URL:
 * - trim spaces
 * - trim leading/trailing quotes
 * - remove trailing slash
 * - validate it's not a token endpoint URL
 */
export function normalizeBaseUrl(url: string): string {
  let normalized = url.trim();
  // Remove leading/trailing double or single quotes
  normalized = normalized.replace(/^["']+|["']+$/g, "");
  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}

export function extractEventiciousCredentials(request: Request): EventiciousCredentials {
  const rawBaseUrl =
    request.headers.get("x-eventicious-base-url") || config.defaultBaseUrl;
  const baseUrl = normalizeBaseUrl(rawBaseUrl);
  const clientId = request.headers.get("x-eventicious-client-id") || "";
  const clientSecret = request.headers.get("x-eventicious-client-secret") || "";

  return { baseUrl, clientId, clientSecret };
}

export function validateEventiciousCredentials(
  creds: EventiciousCredentials
): { ok: true } | { ok: false; error: string } {
  if (!creds.clientId || !creds.clientSecret) {
    const missing: string[] = [];
    if (!creds.clientId) missing.push("x-eventicious-client-id");
    if (!creds.clientSecret) missing.push("x-eventicious-client-secret");
    return {
      ok: false,
      error: `Missing required Eventicious credentials: ${missing.join(", ")}. Pass them via request headers.`,
    };
  }

  if (!creds.baseUrl) {
    return {
      ok: false,
      error:
        "No Eventicious base URL configured. Set EVENTICIOUS_DEFAULT_BASE_URL or pass x-eventicious-base-url header.",
    };
  }

  // Warn if user passed token endpoint URL as base URL
  if (creds.baseUrl.includes("/connect/token")) {
    logger.warn("base_url_is_token_url", { baseUrl: creds.baseUrl });
    return {
      ok: false,
      error:
        "Base URL appears to be a token endpoint URL. Use the base URL (e.g., https://api-integration.eventicious.ru), not the full token endpoint.",
    };
  }

  return { ok: true };
}

export function maskSecret(s: string): string {
  if (!s || s.length < 8) return "***";
  return s.slice(0, 3) + "***" + s.slice(-3);
}
