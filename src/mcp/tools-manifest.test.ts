import { describe, it, expect } from "vitest";
import { getToolManifest } from "./tools-manifest";

describe("tools-manifest", () => {
  it("returns service name and version", () => {
    const manifest = getToolManifest();
    expect(manifest.service).toBe("eventicious-mcp-remote");
    expect(manifest.version).toBe("1.0.0");
  });

  it("returns exactly 75 tools", () => {
    const manifest = getToolManifest();
    expect(manifest.toolCount).toBe(75);
    expect(manifest.tools.length).toBe(75);
  });

  it("includes key tools", () => {
    const manifest = getToolManifest();
    const names = manifest.tools.map((t) => t.name);
    expect(names).toContain("eventicious_auth_check");
    expect(names).toContain("eventicious_get_agent_instructions");
    expect(names).toContain("eventicious_create_catalog");
    expect(names).toContain("eventicious_import_course_structure");
  });

  it("returns unique tool names", () => {
    const manifest = getToolManifest();
    const names = manifest.tools.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("returns sorted tool names", () => {
    const manifest = getToolManifest();
    const names = manifest.tools.map((t) => t.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it("does not contain secrets", () => {
    const manifest = getToolManifest();
    const json = JSON.stringify(manifest);
    expect(json).not.toContain("secret");
    expect(json).not.toContain("token");
    expect(json).not.toContain("password");
    expect(json).not.toContain("encryption_key");
  });
});