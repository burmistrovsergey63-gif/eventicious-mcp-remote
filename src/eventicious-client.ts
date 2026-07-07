import { getCachedToken, setCachedToken } from "./token-cache";
import { AuthError, EventiciousError } from "./errors";
import { maskSecret, NormalizedRequestContext, EventiciousRequestInfo } from "./auth";
import { logger } from "./logger";

export interface EventiciousCredentials {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

async function fetchToken(creds: EventiciousCredentials): Promise<string> {
  const cached = getCachedToken(creds.clientId, creds.baseUrl);
  if (cached) return cached;

  const tokenUrl = `${creds.baseUrl}/connect/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  });

  logger.info("token_request", {
    tokenUrl,
    clientId: maskSecret(creds.clientId),
    baseUrl: creds.baseUrl,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    logger.error("token_request_failed", {
      status: res.status,
      statusText: res.statusText,
      normalizedBaseUrl: creds.baseUrl,
      tokenUrl,
      method: "POST",
      contentType: "application/x-www-form-urlencoded",
      errorBody: errorBody.substring(0, 200),
    });
    throw new AuthError(
      tokenUrl,
      `Token request failed: ${res.status} ${res.statusText}. URL: ${tokenUrl}`
    );
  }

  const data = (await res.json()) as { access_token: string };
  if (!data.access_token) {
    throw new AuthError(tokenUrl, "Token response missing access_token");
  }

  setCachedToken(creds.clientId, creds.baseUrl, data.access_token);
  return data.access_token;
}

export interface EventiciousRequestOptions {
  method: string;
  endpoint: string;
  body?: unknown;
  credentials: EventiciousCredentials;
  isMultipart?: boolean;
  requestContext?: EventiciousRequestInfo;
  acceptLanguage?: string;
}

export interface EventiciousResponse {
  status: number;
  data: unknown;
}

export async function eventiciousRequest(
  opts: EventiciousRequestOptions
): Promise<EventiciousResponse> {
  const { method, endpoint, body, credentials, isMultipart, requestContext, acceptLanguage } = opts;

  const token = await fetchToken(credentials);
  const url = `${credentials.baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (requestContext) {
    headers["EventiciousRequestInfo"] = JSON.stringify(requestContext);
  }

  if (acceptLanguage) {
    headers["Accept-Language"] = acceptLanguage;
  }

  const fetchOpts: RequestInit = { method, headers };
  if (body !== undefined && method !== "GET") {
    if (isMultipart && body instanceof FormData) {
      fetchOpts.body = body;
    } else {
      headers["Content-Type"] = "application/json";
      fetchOpts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(url, fetchOpts);
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    let msg =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as Record<string, unknown>).message)
        : `HTTP ${res.status} ${res.statusText}`;
    const apiBody = typeof data === "object" && data !== null ? data : {};
    const apiErrors = (apiBody as Record<string, unknown>).errors;
    const apiError = (apiBody as Record<string, unknown>).error;
    const apiTitle = (apiBody as Record<string, unknown>).title;

    if (msg === "The request is invalid" && endpoint) {
      const detailParts: string[] = [`Calling ${method} ${endpoint}`];
      if (apiErrors) {
        detailParts.push(`API errors: ${JSON.stringify(apiErrors)}`);
      }
      if (apiError) {
        detailParts.push(`API error: ${apiError}`);
      }
      if (apiTitle) {
        detailParts.push(`API title: ${apiTitle}`);
      }
      msg = `${msg}. ${detailParts.join(". ")}.`;
    }

    logger.error("eventicious_api_error_detail", {
      endpoint,
      status: res.status,
      error: msg,
      hasRequestInfo: !!requestContext,
      acceptLanguage: acceptLanguage,
      eventId: requestContext?.eventId,
    });
    throw new EventiciousError(msg, res.status, endpoint, { apiBody: msg !== "The request is invalid" ? undefined : apiBody });
  }

  return { status: res.status, data };
}
