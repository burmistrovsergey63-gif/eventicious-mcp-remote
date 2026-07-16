import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCachedToken, setCachedToken } from "./token-cache";
import { config } from "./config";

describe("token-cache", () => {
  it("returns null for uncached token", () => {
    expect(getCachedToken("unknown-client", "secret", "https://api.test.com")).toBeNull();
  });

  it("caches and returns token", () => {
    setCachedToken("test-client", "secret-123", "https://api.test.com", "test-token-123");
    expect(getCachedToken("test-client", "secret-123", "https://api.test.com")).toBe("test-token-123");
  });

  it("returns null for expired token", () => {
    vi.spyOn(Date, "now").mockImplementationOnce(() => 1000);
    
    setCachedToken("exp-client", "secret-exp", "https://api.test.com", "exp-token");
    
    vi.spyOn(Date, "now").mockImplementationOnce(() => {
      return 1000 + config.tokenCacheTtlMs + 1000;
    });
    
    expect(getCachedToken("exp-client", "secret-exp", "https://api.test.com")).toBeNull();
    
    vi.restoreAllMocks();
  });

  it("uses correct cache key format with clientSecret", () => {
    setCachedToken("client-a", "secret-a", "https://api.test.com", "token-a");
    setCachedToken("client-a", "secret-b", "https://api.test.com", "token-b");
    
    // Different clientSecrets should have different cache entries
    expect(getCachedToken("client-a", "secret-a", "https://api.test.com")).toBe("token-a");
    expect(getCachedToken("client-a", "secret-b", "https://api.test.com")).toBe("token-b");
  });

  it("separates cache entries by baseUrl", () => {
    setCachedToken("client-a", "secret-a", "https://api.test.com", "token-a");
    setCachedToken("client-a", "secret-a", "https://api.other.com", "token-b");
    
    expect(getCachedToken("client-a", "secret-a", "https://api.test.com")).toBe("token-a");
    expect(getCachedToken("client-a", "secret-a", "https://api.other.com")).toBe("token-b");
  });

  it("prevents cross-credential cache poisoning", () => {
    // Token for credentials A
    setCachedToken("shared-client", "secret-A", "https://api.eventicious.ru", "token-A");
    // Token for credentials B with same clientId but different secret
    setCachedToken("shared-client", "secret-B", "https://api.eventicious.ru", "token-B");
    
    // Each credential pair should get its own token
    expect(getCachedToken("shared-client", "secret-A", "https://api.eventicious.ru")).toBe("token-A");
    expect(getCachedToken("shared-client", "secret-B", "https://api.eventicious.ru")).toBe("token-B");
  });
});
