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
    expect(content).toContain("0.6.4");
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

  it("contains image handling instructions in Russian", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("imageHandling");
    expect(content).toContain("courseCover");
    expect(content).toContain("inlineTextImage");
    expect(content).toContain("Обложка курса");
    expect(content).toContain("Картинка внутри текста");
    expect(content).toContain("публичный URL");
  });
});

describe("x-imgbb-api-key header extraction", () => {
  it("transport.ts reads x-imgbb-api-key from request headers", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("x-imgbb-api-key");
    expect(content).toContain('request.headers.get("x-imgbb-api-key")');
  });

  it("transport.ts passes imgbbApiKey to registerCatalogElementTools", () => {
    const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
    const content = fs.readFileSync(transportPath, "utf-8");

    expect(content).toContain("registerCatalogElementTools(server, credentials, toolError, imgbbApiKey)");
  });

  it("catalog-elements.ts accepts requestScopedImgbbKey parameter", () => {
    const catalogPath = path.join(__dirname, "..", "tools", "catalog-elements.ts");
    const content = fs.readFileSync(catalogPath, "utf-8");

    expect(content).toContain("requestScopedImgbbKey");
    expect(content).toContain("resolveStorageOptions");
    expect(content).toContain("requestScopedImgbbKey || envImgbbApiKey");
  });

  it("catalog-elements.ts has improved missing key error mentioning public URL", () => {
    const catalogPath = path.join(__dirname, "..", "tools", "catalog-elements.ts");
    const content = fs.readFileSync(catalogPath, "utf-8");

    expect(content).toContain("MISSING_INLINE_IMAGE_KEY_ERROR");
    expect(content).toContain("публичный URL");
    expect(content).toContain("Google Drive");
    expect(content).toContain("Яндекс Диск");
  });

  it("catalog-elements.ts has improved fileId error", () => {
    const catalogPath = path.join(__dirname, "..", "tools", "catalog-elements.ts");
    const content = fs.readFileSync(catalogPath, "utf-8");

    expect(content).toContain("FILE_ID_INLINE_ERROR");
    expect(content).toContain("обложки курса");
  });
});
