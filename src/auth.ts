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

export function extractEventiciousCredentials(request: Request): EventiciousCredentials {
  const baseUrl =
    request.headers.get("x-eventicious-base-url") || config.defaultBaseUrl;
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

  return { ok: true };
}

export function maskSecret(s: string): string {
  if (!s || s.length < 8) return "***";
  return s.slice(0, 3) + "***" + s.slice(-3);
}
