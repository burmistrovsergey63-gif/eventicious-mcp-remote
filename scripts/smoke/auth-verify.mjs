import { getRequiredEnv, requestJson, printStep, printPass, printFail } from "./utils.mjs";

printStep("smoke-auth-verify — GET /auth/verify");
const baseUrl = getRequiredEnv("MCP_REMOTE_URL");
const token = getRequiredEnv("MCP_ACCESS_TOKEN");
const url = baseUrl.replace(/\/$/, "") + "/auth/verify";

const { status, json, raw } = await requestJson(url, {
  headers: { Authorization: `Bearer ${token}` },
});

if (status !== 200) {
  printFail(`Expected HTTP 200, got ${status}`);
  console.error(`  Response: ${raw}`);
  process.exit(1);
}

if (!json || json.ok !== true) {
  printFail("Expected ok: true");
  process.exit(1);
}

if (!json.service || json.service !== "eventicious-mcp-remote") {
  printFail(`Expected service "eventicious-mcp-remote", got "${json.service}"`);
  process.exit(1);
}

if (typeof json.toolsCount !== "number") {
  printFail("Missing toolsCount field");
  process.exit(1);
}

printPass(`HTTP 200 ok: true, toolsCount=${json.toolsCount}, service=${json.service}, version=${json.version}`);
