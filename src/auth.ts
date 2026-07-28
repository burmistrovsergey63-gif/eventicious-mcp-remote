import { createHash } from "crypto";
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

export type CredentialSource = "bearer_mcp_token" | "legacy_headers";

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

export interface AuthContext {
  credentials: EventiciousCredentials;
  requestContext: NormalizedRequestContext | null;
  credentialSource: CredentialSource;
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

/**
 * Compute SHA-256 fingerprint prefix for diagnostic logging.
 * Returns first 12 hex chars of the SHA-256 hash.
 */
export function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

/**
 * Layero currently strips the standard Authorization header before the
 * request reaches Next.js. Accept an explicit MCP-only fallback header while
 * keeping Authorization as the preferred transport everywhere else.
 */
export function getMcpAuthorizationHeader(request: Request): string | null {
  return (
    request.headers.get("authorization") ||
    request.headers.get("x-mcp-authorization")
  );
}

export function validateMcpToken(request: Request): boolean {
  if (!config.mcpAccessToken) {
    logger.warn("mcp_token_skip", { reason: "MCP_ACCESS_TOKEN not set, allowing request in dev mode" });
    return true;
  }

  const authHeader = getMcpAuthorizationHeader(request);
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
 * Check if request has legacy Eventicious credential headers.
 */
function hasLegacyCredentials(request: Request): boolean {
  return !!(
    request.headers.get("x-eventicious-client-id") ||
    request.headers.get("x-eventicious-client-secret") ||
    request.headers.get("x-eventicious-base-url")
  );
}

/**
 * Extract full auth context from request.
 * Returns structured error when Bearer + legacy headers conflict.
 * When Bearer mcp_evt_ token is present, credentials come ONLY from token claims.
 * Legacy headers are used ONLY when no Bearer token is present.
 */
export function extractAuthContext(request: Request): AuthContext | { error: string; code: string } {
  const authHeader = getMcpAuthorizationHeader(request);
  const hasBearer = !!(authHeader && authHeader.toLowerCase().startsWith("bearer "));
  const hasMcpEvtToken = hasBearer && authHeader!.slice(7).trim().startsWith("mcp_evt_");
  const hasLegacy = hasLegacyCredentials(request);

  if (hasMcpEvtToken && hasLegacy) {
    return {
      error: "Conflicting auth sources: Bearer MCP token and legacy x-eventicious-* headers both present. Use one or the other, not both.",
      code: "conflicting_auth_sources",
    };
  }

  if (hasMcpEvtToken) {
    const token = authHeader!.slice(7).trim();
    const payload = decryptMcpToken(token);
    if (payload) {
      const requestContext = extractRequestContext(payload);
      return {
        credentials: {
          baseUrl: payload.baseUrl,
          clientId: payload.clientId,
          clientSecret: payload.clientSecret,
        },
        requestContext,
        credentialSource: "bearer_mcp_token" as CredentialSource,
      };
    }
  }

  // Non-mcp_evt Bearer token or no Bearer at all: fall through to legacy headers
  const rawBaseUrl =
    request.headers.get("x-eventicious-base-url") || config.defaultBaseUrl;
  const baseUrl = normalizeBaseUrl(rawBaseUrl);
  const clientId = request.headers.get("x-eventicious-client-id") || "";
  const clientSecret = request.headers.get("x-eventicious-client-secret") || "";

  return {
    credentials: { baseUrl, clientId, clientSecret },
    requestContext: null,
    credentialSource: "legacy_headers" as CredentialSource,
  };
}

/**
 * Extract Eventicious credentials from request.
 * Supports both legacy headers and new MCP token format.
 * @deprecated Use extractAuthContext instead for full isolation.
 */
export function extractEventiciousCredentials(request: Request): EventiciousCredentials {
  const result = extractAuthContext(request);
  if ("error" in result) {
    return { baseUrl: config.defaultBaseUrl, clientId: "", clientSecret: "" };
  }
  return result.credentials;
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
