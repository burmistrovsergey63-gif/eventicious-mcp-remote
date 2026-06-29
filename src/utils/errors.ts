import { maskSecret } from "../auth";

export type StructuredError = {
  code: string;
  message: string;
  details?: unknown;
  retryable: boolean;
  safe_to_retry: boolean;
};

const SENSITIVE_PATTERNS = [
  /bearer[\s=]+['"]?[a-zA-Z0-9\-_\.]+/gi,
  /token[\s=]+['"]?[a-zA-Z0-9\-_\.]+/gi,
  /password[\s=]+['"]?[^\s'"]+/gi,
  /secret[\s=]+['"]?[^\s'"]+/gi,
  /client[_-]?secret[\s=]+['"]?[^\s'"]+/gi,
];

function maskSensitive(text: string): string {
  let masked = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    masked = masked.replace(pattern, (match) => {
      const value = match.split(/[\s=]+/)[1] || "";
      return match.substring(0, match.lastIndexOf(value)) + maskSecret(value);
    });
  }
  return masked;
}

function getErrorCode(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("unauthorized") || lower.includes("authentication") || lower.includes("401")) return "UNAUTHORIZED";
  if (lower.includes("forbidden") || lower.includes("403")) return "FORBIDDEN";
  if (lower.includes("not found") || lower.includes("404")) return "NOT_FOUND";
  if (lower.includes("rate limit") || lower.includes("429")) return "RATE_LIMITED";
  if (lower.includes("timeout")) return "TIMEOUT";
  if (lower.includes("network") || lower.includes("econnrefused")) return "NETWORK_ERROR";
  return "UNKNOWN_ERROR";
}

function isRetryable(code: string): boolean {
  return ["RATE_LIMITED", "TIMEOUT", "NETWORK_ERROR"].includes(code);
}

function isSafeToRetry(code: string): boolean {
  return ["RATE_LIMITED", "NETWORK_ERROR"].includes(code);
}

export function createStructuredError(
  message: string,
  details?: unknown
): StructuredError {
  const code = getErrorCode(message);
  const maskedMessage = maskSensitive(message);
  
  return {
    code,
    message: maskedMessage,
    details,
    retryable: isRetryable(code),
    safe_to_retry: isSafeToRetry(code),
  };
}

export function normalizeToStructuredError(
  error: unknown,
  defaultMessage = "Unknown error"
): StructuredError {
  if (error instanceof Error) {
    return createStructuredError(error.message, { name: error.name });
  }
  if (typeof error === "string") {
    return createStructuredError(error);
  }
  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, unknown>;
    const message = typeof errObj.message === "string" ? errObj.message : defaultMessage;
    const { message: _msg, ...safeDetails } = errObj;
    return createStructuredError(message, safeDetails);
  }
  return createStructuredError(defaultMessage);
}