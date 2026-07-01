import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function countToolCallsInFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const matches = content.matchAll(/server\.tool\(\s*["']([^"']+)["']/g);
  return Array.from(matches).map((m) => m[1]);
}

function getAllToolNames(): string[] {
  const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
  const toolsDir = path.join(__dirname, "..", "tools");

  const names: string[] = [];

  const transportNames = countToolCallsInFile(transportPath);
  names.push(...transportNames);

  const toolFiles = fs.readdirSync(toolsDir).filter((f) => f.endsWith(".ts"));
  for (const file of toolFiles) {
    const filePath = path.join(toolsDir, file);
    names.push(...countToolCallsInFile(filePath));
  }

  return names;
}

describe("MCP tools count", () => {
  it("registers exactly 75 tools", () => {
    const toolNames = getAllToolNames();
    expect(toolNames.length).toBe(75);
  });

  it("includes eventicious_get_agent_instructions", () => {
    const toolNames = getAllToolNames();
    expect(toolNames).toContain("eventicious_get_agent_instructions");
  });
});

describe("eventicious_get_agent_instructions", () => {
  it("transport.ts contains tool definition with expected content", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("eventicious_get_agent_instructions");
    expect(content).toContain("mcpVersion");
    expect(content).toContain("0.6.3");
    expect(content).toContain("expectedToolsCount");
    expect(content).toContain("75");
    expect(content).toContain("useUtf8ForRussianText");
    expect(content).toContain("useDryRunBeforeWrites");
    expect(content).toContain("doNotUsePowerShell51BodyAsStringForJsonWithCyrillic");
    expect(content).toContain("destructiveOperationsRequireDangerConfirm");
    expect(content).toContain("safeReadOnlyCategories");
    expect(content).toContain("prepareToolsAreSafe");
  });
});

describe("auth_check agentGuidance", () => {
  it("transport.ts contains agentGuidance in auth_check success response", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("agentGuidance");
    expect(content).toContain("toolsAvailable");
    expect(content).toContain("directPowerShellHttpJsonMustUseUtf8Bytes");
  });

  it("auth_check success response has backward-compatible fields", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("success: true");
    expect(content).toContain('"Credentials valid"');
    expect(content).toContain("toolsAvailable: 75");
  });

  it("auth_check returns toolError on failure", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("auth_check_failed");
    expect(content).toContain("toolError");
  });
});

describe("eventicious_get_agent_instructions content", () => {
  it("contains UTF-8 and PowerShell warnings", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("useUtf8: true");
    expect(content).toContain("doNotUsePowerShell51BodyAsStringForJsonWithCyrillic");
    expect(content).toContain("forDirectHttpRequestsUseUtf8ByteArray");
    expect(content).toContain("contentTypeHeader");
  });

  it("contains dry_run and confirm rules", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("useDryRunBeforeWrites: true");
    expect(content).toContain("realChangesOnlyAfterDryRunFalseAndConfirmTrue");
    expect(content).toContain("destructiveOperationsRequireDangerConfirm: true");
  });

  it("clarifies prepare tools are safe", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("prepareToolsAreSafe");
    expect(content).toContain("Prepare tools build a plan or structure without writing to Eventicious");
  });

  it("is read-only (no parameters)", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    const match = content.match(
      /server\.tool\(\s*"eventicious_get_agent_instructions"[\s\S]*?\{\},\s*async/
    );
    expect(match).toBeTruthy();
  });
});
