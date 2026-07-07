import { getRequiredEnv, requestJson, printStep, printPass, printFail } from "./utils.mjs";

const EXPECTED_TOOLS = 75;

printStep("smoke-remote-tools — POST /mcp (initialize + tools/list)");
const baseUrl = getRequiredEnv("MCP_REMOTE_URL");
const token = getRequiredEnv("MCP_ACCESS_TOKEN");
const url = baseUrl.replace(/\/$/, "") + "/mcp";

const headers = { Authorization: `Bearer ${token}` };

const initRes = await requestJson(url, {
  method: "POST",
  headers,
  body: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "smoke-remote-tools", version: "0.0.1" } } },
});

if (initRes.status !== 200) {
  printFail(`initialize: expected HTTP 200, got ${initRes.status}`);
  console.error(`  Response: ${initRes.raw}`);
  process.exit(1);
}

if (!initRes.json || initRes.json.error) {
  printFail(`initialize: ${initRes.json?.error?.message || "unexpected error"}`);
  process.exit(1);
}

printPass("initialize ok");

const listRes = await requestJson(url, {
  method: "POST",
  headers,
  body: { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
});

if (listRes.status !== 200) {
  printFail(`tools/list: expected HTTP 200, got ${listRes.status}`);
  console.error(`  Response: ${listRes.raw}`);
  process.exit(1);
}

if (!listRes.json || listRes.json.error) {
  printFail(`tools/list: ${listRes.json?.error?.message || "unexpected error"}`);
  process.exit(1);
}

const tools = listRes.json.result?.tools;
if (!Array.isArray(tools)) {
  printFail("tools/list: result.tools is not an array");
  process.exit(1);
}

if (tools.length !== EXPECTED_TOOLS) {
  printFail(`Expected ${EXPECTED_TOOLS} tools, got ${tools.length}`);
  process.exit(1);
}

printPass(`tools/list ok — ${tools.length} tools`);
