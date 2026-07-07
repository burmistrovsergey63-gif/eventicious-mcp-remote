import { NextResponse } from "next/server";
import { logger } from "../../src/logger";

export async function GET() {
  logger.info("health_check");
  return NextResponse.json({
    ok: true,
    service: "eventicious-mcp-remote",
    version: "1.0.0",
  });
}
