import { NextResponse } from "next/server";
import { validateMcpToken } from "../../src/auth";
import { handleMcpRequest } from "../../src/mcp/transport";
import { logger } from "../../src/logger";

export async function POST(request: Request) {
  if (!validateMcpToken(request)) {
    logger.warn("mcp_unauthorized", { reason: "Invalid or missing MCP_ACCESS_TOKEN" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await handleMcpRequest(request);
  } catch (e) {
    logger.error("mcp_internal_error", {
      error: e instanceof Error ? e.message : "Internal error",
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "eventicious-mcp-remote",
    protocol: "mcp",
    endpoint: "POST /mcp",
    version: "0.6.2",
  });
}
