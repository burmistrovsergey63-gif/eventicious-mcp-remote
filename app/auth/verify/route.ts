import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { verifyMcpToken } from "@/auth/mcp-token";
import { checkEventiciousCredentials } from "@/auth/eventicious-credentials";
import { maskSecret } from "@/auth";

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export async function GET(request: Request) {
  const token = extractBearerToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authorization header required" },
      { status: 401 }
    );
  }

  const verified = verifyMcpToken(token);

  if (!verified.ok) {
    if (verified.error === "expired_token") {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 401 }
      );
    }
    if (verified.error === "malformed_token" || verified.error === "invalid_token") {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }

  const { baseUrl, clientId, clientSecret, expiresAt } = verified.payload;

  const check = await checkEventiciousCredentials({
    baseUrl,
    clientId,
    clientSecret,
  });

  if (!check.ok) {
    logger.warn("mcp_token_verify_revoked", { clientIdMasked: maskSecret(clientId) });
    return NextResponse.json(
      { error: "Credentials revoked or invalid" },
      { status: 401 }
    );
  }

  logger.info("auth_verify_success", { clientIdMasked: maskSecret(clientId) });

  return NextResponse.json({
    ok: true,
    service: "eventicious-mcp-remote",
    version: "0.6.3",
    toolsCount: 75,
    eventiciousBaseUrl: baseUrl,
    clientIdMasked: maskSecret(clientId),
    expiresAt,
  });
}