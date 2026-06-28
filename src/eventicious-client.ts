import { getCachedToken, setCachedToken } from "./token-cache";
import { AuthError, EventiciousError } from "./errors";
import { maskSecret } from "./auth";
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
}

export interface EventiciousResponse {
  status: number;
  data: unknown;
}

export async function eventiciousRequest(
  opts: EventiciousRequestOptions
): Promise<EventiciousResponse> {
  const { method, endpoint, body, credentials, isMultipart } = opts;

  const token = await fetchToken(credentials);
  const url = `${credentials.baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

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
    const msg =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as Record<string, unknown>).message)
        : `HTTP ${res.status} ${res.statusText}`;
    logger.error("eventicious_api_error_detail", {
      endpoint,
      status: res.status,
    });
    throw new EventiciousError(msg, res.status, endpoint);
  }

  return { status: res.status, data };
}
