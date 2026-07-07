import { describe, it, expect, vi, afterEach } from "vitest";
import { maskSecret, safeJsonParse, getRequiredEnv } from "./utils.mjs";

describe("maskSecret", () => {
  it("returns (empty) for null/undefined/non-string", () => {
    expect(maskSecret(null)).toBe("(empty)");
    expect(maskSecret(undefined)).toBe("(empty)");
    expect(maskSecret(123)).toBe("(empty)");
  });

  it("returns **** for short strings (<=8 chars)", () => {
    expect(maskSecret("abc")).toBe("****");
    expect(maskSecret("12345678")).toBe("****");
  });

  it("masks long strings showing first 4 and last 4", () => {
    expect(maskSecret("abcdefghijklmnop")).toBe("abcd****mnop");
    expect(maskSecret("mcp_evt_abcdef123456")).toBe("mcp_****3456");
  });
});

describe("safeJsonParse", () => {
  it("returns ok:true for valid JSON", () => {
    const result = safeJsonParse('{"a":1}');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ a: 1 });
  });

  it("returns ok:false for invalid JSON", () => {
    const result = safeJsonParse("not json");
    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
  });

  it("parses JSON arrays", () => {
    const result = safeJsonParse("[1,2,3]");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([1, 2, 3]);
  });
});

describe("getRequiredEnv", () => {
  afterEach(() => {
    delete process.env.TEST_ENV_VAR;
  });

  it("returns value when env var is set", () => {
    process.env.TEST_ENV_VAR = "hello";
    expect(getRequiredEnv("TEST_ENV_VAR")).toBe("hello");
  });

  it("trims whitespace", () => {
    process.env.TEST_ENV_VAR = "  hello  ";
    expect(getRequiredEnv("TEST_ENV_VAR")).toBe("hello");
  });

  it("exits with code 1 when env var is missing", () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation(() => undefined);
    delete process.env.TEST_ENV_VAR;
    getRequiredEnv("TEST_ENV_VAR");
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it("exits with code 1 when env var is empty string", () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation(() => undefined);
    process.env.TEST_ENV_VAR = "   ";
    getRequiredEnv("TEST_ENV_VAR");
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
