export interface ToolManifestEntry {
  name: string;
}

export interface ToolsManifest {
  service: string;
  version: string;
  toolCount: number;
  tools: ToolManifestEntry[];
}

import { TOOL_NAMES } from "../generated/tools-registry";

export function getToolManifest(): ToolsManifest {
  return {
    service: "eventicious-mcp-remote",
    version: "1.0.0",
    toolCount: TOOL_NAMES.length,
    tools: TOOL_NAMES.map((name) => ({ name })),
  };
}
