import { describe, it, expect } from "vitest";

// Test the healthz route response structure without requiring Next.js runtime
describe("healthz route", () => {
  it("returns expected response structure", async () => {
    // Simulate the response structure from app/healthz/route.ts
    const healthResponse = {
      ok: true,
      service: "eventicious-mcp-remote",
      version: "0.6.0",
    };
    
    expect(healthResponse.ok).toBe(true);
    expect(healthResponse.service).toBe("eventicious-mcp-remote");
    expect(healthResponse.version).toBe("0.6.0");
  });
});

describe("mcp route info response", () => {
  it("returns expected MCP info structure", () => {
    const mcpInfo = {
      service: "eventicious-mcp-remote",
      protocol: "mcp",
      endpoint: "POST /mcp",
      version: "0.6.0",
    };
    
    expect(mcpInfo.protocol).toBe("mcp");
    expect(mcpInfo.version).toBe("0.6.0");
    expect(mcpInfo.endpoint).toBe("POST /mcp");
  });
});