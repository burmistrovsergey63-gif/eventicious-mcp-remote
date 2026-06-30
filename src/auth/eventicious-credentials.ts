import { logger } from "../logger";

interface EventiciousCredentialsCheck {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

type CheckResult =
  | { ok: true }
  | { ok: false; error: "invalid_credentials" | "eventicious_unavailable" | "invalid_base_url" | "timeout" | "unknown_error" };

export async function checkEventiciousCredentials(
  creds: EventiciousCredentialsCheck
): Promise<CheckResult> {
  const { baseUrl, clientId, clientSecret } = creds;

  if (!baseUrl || !baseUrl.startsWith("http")) {
    logger.warn("eventicious_cred_check_invalid", { reason: "invalid_base_url" });
    return { ok: false, error: "invalid_base_url" };
  }

  if (!clientId || !clientSecret) {
    logger.warn("eventicious_cred_check_invalid", { reason: "invalid_credentials" });
    return { ok: false, error: "invalid_credentials" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const tokenEndpoint = `${baseUrl}/connect/token`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });

    const resp = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (resp.ok) {
      return { ok: true };
    }

    if (resp.status === 401) {
      logger.warn("eventicious_cred_check_invalid", { reason: "invalid_credentials" });
      return { ok: false, error: "invalid_credentials" };
    }

    logger.warn("eventicious_cred_check_failed", { status: resp.status });
    return { ok: false, error: "eventicious_unavailable" };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      logger.warn("eventicious_cred_check_timeout", { reason: "timeout" });
      return { ok: false, error: "timeout" };
    }
    logger.warn("eventicious_cred_check_error", { error: e instanceof Error ? e.message : "unknown" });
    return { ok: false, error: "unknown_error" };
  }
}

export function normalizeAndValidateBaseUrl(url: string): { ok: true; normalized: string } | { ok: false; error: string } {
  if (!url) {
    return { ok: false, error: "Missing base URL" };
  }

  let normalized = url.trim();
  normalized = normalized.replace(/^["']+|["']+$/g, "");
  normalized = normalized.replace(/\/+$/, "");

  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    return { ok: false, error: "Base URL must start with http:// or https://" };
  }

  if (normalized.includes("/connect/token")) {
    return { ok: false, error: "Base URL appears to be a token endpoint URL. Use the base URL instead." };
  }

  return { ok: true, normalized };
}