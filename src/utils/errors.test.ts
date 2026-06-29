import { describe, it, expect } from "vitest";
import {
  createStructuredError,
  normalizeToStructuredError,
  type StructuredError,
} from "./errors";

describe("createStructuredError", () => {
  it("creates structured error with default code", () => {
    const result = createStructuredError("Some error occurred");
    expect(result.code).toBe("UNKNOWN_ERROR");
    expect(result.message).toBe("Some error occurred");
    expect(result.retryable).toBe(false);
    expect(result.safe_to_retry).toBe(false);
  });

  it("sets retryable for rate limit errors", () => {
    const result = createStructuredError("Rate limit exceeded");
    expect(result.code).toBe("RATE_LIMITED");
    expect(result.retryable).toBe(true);
    expect(result.safe_to_retry).toBe(true);
  });

  it("sets retryable for timeout errors", () => {
    const result = createStructuredError("Request timeout");
    expect(result.code).toBe("TIMEOUT");
    expect(result.retryable).toBe(true);
    expect(result.safe_to_retry).toBe(false);
  });

  it("sets retryable for network errors", () => {
    const result = createStructuredError("Network connection refused");
    expect(result.code).toBe("NETWORK_ERROR");
    expect(result.retryable).toBe(true);
    expect(result.safe_to_retry).toBe(true);
  });

  it("includes details when provided", () => {
    const result = createStructuredError("Error", { field: "value" });
    expect(result.details).toEqual({ field: "value" });
  });
});

describe("normalizeToStructuredError", () => {
  it("normalizes Error object", () => {
    const error = new Error("Authentication failed");
    const result = normalizeToStructuredError(error);
    expect(result.code).toBe("UNAUTHORIZED");
    expect(result.message).toBe("Authentication failed");
  });

  it("normalizes string error", () => {
    const result = normalizeToStructuredError("Something went wrong");
    expect(result.code).toBe("UNKNOWN_ERROR");
    expect(result.message).toBe("Something went wrong");
  });

  it("normalizes object with message", () => {
    const result = normalizeToStructuredError({ message: "Not found", status: 404 });
    expect(result.code).toBe("NOT_FOUND");
    expect(result.message).toBe("Not found");
    expect(result.details).toEqual({ status: 404 });
  });

  it("uses default message for null/undefined", () => {
    const result = normalizeToStructuredError(null, "Default error");
    expect(result.message).toBe("Default error");
  });
});

describe("secret masking", () => {
  it("masks bearer tokens in error messages", () => {
    const result = createStructuredError("Bearer abc123def456");
    expect(result.message).toContain("***");
    expect(result.message).not.toContain("abc123def456");
  });

  it("masks passwords in error messages", () => {
    const result = createStructuredError("Password mypass123 leaked");
    expect(result.message).toContain("***");
  });

  it("preserves safe public details", () => {
    const result = createStructuredError("Error", { id: 123, action: "create" });
    expect(result.details).toEqual({ id: 123, action: "create" });
  });
});