import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { logger } from "./logger";

describe("logger masking", () => {
  let consoleSpy: { log: ReturnType<typeof vi.spyOn> };

  beforeEach(() => {
    consoleSpy = { log: vi.spyOn(console, "log").mockImplementation(() => {}) };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("masks client_secret in logs", () => {
    logger.info("test_event", { client_secret: "verysecret123" });
    const output = consoleSpy.log.mock.calls[0]?.[0];
    expect(output).toContain("***");
    expect(output).not.toContain("verysecret123");
  });

  it("masks authorization in logs", () => {
    logger.info("auth_check", { authorization: "Bearer secret-token" });
    const output = consoleSpy.log.mock.calls[0]?.[0];
    expect(output).toContain("***");
    expect(output).not.toContain("secret-token");
  });

  it("masks token in logs", () => {
    logger.info("token_event", { token: "my-bearer-token" });
    const output = consoleSpy.log.mock.calls[0]?.[0];
    expect(output).toContain("***");
    expect(output).not.toContain("my-bearer-token");
  });

  it("masks password in logs", () => {
    logger.info("login", { password: "mypassword123", user: "testuser" });
    const output = consoleSpy.log.mock.calls[0]?.[0];
    expect(output).toContain("***");
    expect(output).toContain("testuser");
    expect(output).not.toContain("mypassword123");
  });

  it("masks nested secret values", () => {
    logger.info("nested", { credentials: { clientSecret: "secret123", clientId: "public" } });
    const output = consoleSpy.log.mock.calls[0]?.[0];
    expect(output).toContain("***");
    expect(output).toContain("public");
    expect(output).not.toContain("secret123");
  });

  it("does not mask short secrets", () => {
    logger.info("short", { client_secret: "abc" });
    const output = consoleSpy.log.mock.calls[0]?.[0];
    expect(output).toContain("***");
  });
});