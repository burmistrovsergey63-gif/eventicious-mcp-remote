import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCachedToken, setCachedToken } from "./token-cache";
import { config } from "./config";

describe("token-cache", () => {
  beforeEach(() => {
    // Clear the cache by accessing internal state (we'll test via public API)
  });

  it("returns null for uncached token", () => {
    expect(getCachedToken("unknown-client", "https://api.test.com")).toBeNull();
  });

  it("caches and returns token", () => {
    setCachedToken("test-client", "https://api.test.com", "test-token-123");
    expect(getCachedToken("test-client", "https://api.test.com")).toBe("test-token-123");
  });

  it("returns null for expired token", () => {
    // Mock Date.now to simulate expiration
    const originalDateNow = Date.now;
    vi.spyOn(Date, "now").mockImplementationOnce(() => 1000);
    
    setCachedToken("exp-client", "https://api.test.com", "exp-token");
    
    vi.spyOn(Date, "now").mockImplementationOnce(() => {
      // Token should be expired since config.tokenCacheTtlMs would make it expire
      return 1000 + config.tokenCacheTtlMs + 1000;
    });
    
    expect(getCachedToken("exp-client", "https://api.test.com")).toBeNull();
    
    vi.restoreAllMocks();
  });

  it("uses correct cache key format", () => {
    setCachedToken("client-a", "https://api.test.com", "token-a");
    setCachedToken("client-a", "https://api.other.com", "token-b");
    
    // Different base URLs should have different cache entries
    expect(getCachedToken("client-a", "https://api.test.com")).toBe("token-a");
    expect(getCachedToken("client-a", "https://api.other.com")).toBe("token-b");
  });
});