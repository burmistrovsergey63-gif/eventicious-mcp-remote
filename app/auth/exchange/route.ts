import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/logger";
import { checkEventiciousCredentials, normalizeAndValidateBaseUrl } from "@/auth/eventicious-credentials";
import { issueMcpToken, validateEncryptionKey } from "@/auth/mcp-token";

const exchangeSchema = z.object({
  baseUrl: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  label: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = exchangeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { baseUrl, clientId, clientSecret, label } = parsed.data;

    // Check encryption key config before validating Eventicious credentials
    const keyPresent = !!process.env.MCP_TOKEN_ENCRYPTION_KEY;
    if (!validateEncryptionKey()) {
      const keyHex = process.env.MCP_TOKEN_ENCRYPTION_KEY?.trim() ?? "";
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: {
            keyPresent,
            keyLength: keyHex.length,
            keyLooksHex64: /^[a-f0-9]{64}$/i.test(keyHex),
            expected: "MCP_TOKEN_ENCRYPTION_KEY must be 64-char hex string",
          },
        },
        { status: 500 }
      );
    }

    const urlValidation = normalizeAndValidateBaseUrl(baseUrl);
    if (!urlValidation.ok) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      );
    }

    const check = await checkEventiciousCredentials({
      baseUrl: urlValidation.normalized,
      clientId,
      clientSecret,
    });

    if (!check.ok) {
      if (check.error === "invalid_credentials") {
        return NextResponse.json(
          { error: "Invalid Eventicious credentials" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Unable to reach Eventicious API" },
        { status: 502 }
      );
    }

    const tokenResult = issueMcpToken({
      baseUrl: urlValidation.normalized,
      clientId,
      clientSecret,
    });

    if (typeof tokenResult === "object" && "error" in tokenResult) {
      logger.warn("mcp_token_issue_failed", { reason: "crypto_error" });
      return NextResponse.json(
        { error: "Token exchange failed" },
        { status: 500 }
      );
    }

    const mcpToken = tokenResult;

    logger.info("auth_exchange_success", { label: label || "unnamed" });

    return NextResponse.json({
      ok: true,
      mcpToken,
      mcpUrl: process.env.MCP_PUBLIC_BASE_URL || "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      toolsCount: 75,
    });
  } catch (e) {
    logger.error("auth_exchange_error", { error: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}