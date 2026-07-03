import { config } from "./config";
import { logger } from "./logger";
import { decryptMcpToken } from "./auth/mcp-token";

/**
 * Default course context constants
 */
export const DEFAULT_COURSE_CONTEXT = {
  applicationId: "0",
  languageId: "1",
  appLanguageId: "0",
  acceptLanguage: "ru",
};

/**
 * Error codes for missing context
 */
export const MISSING_EVENT_ID_ERROR = "missing_event_id";
export const MISSING_REQUEST_INFO_ERROR = "missing_eventicious_request_info";

export interface EventiciousCredentials {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface EventiciousRequestInfo {
  eventId: string;
  applicationId: string;
  languageId: string;
  appLanguageId: string;
}

export interface DefaultCourseContext {
  applicationId: string;
  languageId: string;
  appLanguageId: string;
  acceptLanguage: string;
}

export interface NormalizedRequestContext extends EventiciousRequestInfo {
  eventIdSource?: string;
  acceptLanguage?: string;
}

/**
 * Normalize Eventicious base URL:
 * - trim spaces
 * - trim leading/trailing quotes
 * - remove trailing slash
 */
export function normalizeBaseUrl(url: string): string {
  let normalized = url.trim();
  normalized = normalized.replace(/^["']+|["']+$/g, "");
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}

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

  // Check if it's our MCP token format
  if (token.startsWith("mcp_evt_")) {
    const payload = decryptMcpToken(token);
    return payload !== null;
  }

  return token === config.mcpAccessToken;
}

/**
 * Extract Eventicious credentials from request.
 * Supports both legacy headers and new MCP token format.
 */
export function extractEventiciousCredentials(request: Request): EventiciousCredentials {
  // First check if we have MCP token with embedded credentials
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.startsWith("mcp_evt_")) {
      const payload = decryptMcpToken(token);
      if (payload) {
        return {
          baseUrl: payload.baseUrl,
          clientId: payload.clientId,
          clientSecret: payload.clientSecret,
        };
      }
    }
  }

  // Legacy: extract from headers
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

/**
 * Extract request context from MCP token payload
 */
export function extractRequestContext(payload: any): NormalizedRequestContext | null {
  if (!payload) return null;
  
  try {
    const context: any = {
      applicationId: "0",
      languageId: "1",
      appLanguageId: "0",
      acceptLanguage: "ru",
    };

    if (payload.requestInfo) {
      const requestInfo = typeof payload.requestInfo === "string" 
        ? JSON.parse(payload.requestInfo) 
        : payload.requestInfo;
      
      if (requestInfo.eventId) {
        context.eventId = requestInfo.eventId;
      }
      if (requestInfo.applicationId) context.applicationId = requestInfo.applicationId;
      if (requestInfo.languageId) context.languageId = requestInfo.languageId;
      if (requestInfo.appLanguageId) context.appLanguageId = requestInfo.appLanguageId;
      if (requestInfo.acceptLanguage) context.acceptLanguage = requestInfo.acceptLanguage;
    } else if (payload.eventId) {
      context.eventId = payload.eventId;
    }

    return {
      eventId: context.eventId || "",
      applicationId: context.applicationId,
      languageId: context.languageId,
      appLanguageId: context.appLanguageId,
      acceptLanguage: context.acceptLanguage,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Validate if a course operation can proceed
 */
export function validateCourseOperation(
  requestContext?: NormalizedRequestContext,
  toolArgEventId?: string
): { ok: true } | { ok: false; error: string; code: string } {
  const context = requestContext ?? {} as NormalizedRequestContext;

  if (toolArgEventId) {
    return { ok: true };
  }

  if (!context.eventId) {
    return {
      ok: false,
      error: "Course import requires eventId to build EventiciousRequestInfo.",
      code: MISSING_EVENT_ID_ERROR,
    };
  }

  return { ok: true };
}