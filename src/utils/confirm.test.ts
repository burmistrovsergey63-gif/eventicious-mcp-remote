import { describe, it, expect, beforeEach, vi } from "vitest";
import { requireDangerConfirm, requireConfirm } from "./confirm";

describe("requireDangerConfirm", () => {
  it("returns true when dangerConfirm matches expected", () => {
    expect(requireDangerConfirm("DELETE_EVENTICIOUS_USERS", "DELETE_EVENTICIOUS_USERS")).toBe(true);
  });

  it("returns false when dangerConfirm is undefined", () => {
    expect(requireDangerConfirm(undefined, "DELETE_EVENTICIOUS_USERS")).toBe(false);
  });

  it("returns false when dangerConfirm does not match expected", () => {
    expect(requireDangerConfirm("WRONG_STRING", "DELETE_EVENTICIOUS_USERS")).toBe(false);
  });

  it("returns false when dangerConfirm is empty string", () => {
    expect(requireDangerConfirm("", "DELETE_EVENTICIOUS_USERS")).toBe(false);
  });
});

describe("requireConfirm", () => {
  it("returns true when dry_run=false and confirm=false (needs confirmation)", () => {
    expect(requireConfirm(false, false)).toBe(true);
  });

  it("returns false when dry_run=true (dry run does not need confirmation)", () => {
    expect(requireConfirm(true, false)).toBe(false);
    expect(requireConfirm(true, true)).toBe(false);
  });

  it("returns false when confirm=true", () => {
    expect(requireConfirm(false, true)).toBe(false);
  });
});