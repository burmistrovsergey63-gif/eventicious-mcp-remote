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

  const url = `${creds.baseUrl}/connect/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  });

  logger.info("token_request", { url, clientId: maskSecret(creds.clientId) });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    logger.error("token_request_failed", { status: res.status, statusText: res.statusText });
    throw new AuthError(
      url,
      `Token request failed: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as { access_token: string };
  if (!data.access_token) {
    throw new AuthError(url, "Token response missing access_token");
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
