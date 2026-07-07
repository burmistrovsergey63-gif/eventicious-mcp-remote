import * as fs from "fs";
import * as path from "path";

export interface ToolManifestEntry {
  name: string;
}

export interface ToolsManifest {
  service: string;
  version: string;
  toolCount: number;
  tools: ToolManifestEntry[];
}

function countToolCallsInFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const matches = content.matchAll(/server\.tool\(\s*["']([^"']+)["']/g);
  return Array.from(matches).map((m) => m[1]);
}

export function getToolManifest(): ToolsManifest {
  const transportPath = path.join(__dirname, "..", "mcp", "transport.ts");
  const toolsDir = path.join(__dirname, "..", "tools");

  const names: string[] = [];

  if (fs.existsSync(transportPath)) {
    names.push(...countToolCallsInFile(transportPath));
  }

  if (fs.existsSync(toolsDir)) {
    const toolFiles = fs.readdirSync(toolsDir).filter((f) => f.endsWith(".ts"));
    for (const file of toolFiles) {
      const filePath = path.join(toolsDir, file);
      names.push(...countToolCallsInFile(filePath));
    }
  }

  const uniqueNames = [...new Set(names)].sort();

  return {
    service: "eventicious-mcp-remote",
    version: "1.0.0",
    toolCount: uniqueNames.length,
    tools: uniqueNames.map((name) => ({ name })),
  };
}