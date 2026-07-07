import { getRequiredEnv, requestJson, printStep, printPass, printFail } from "./utils.mjs";

printStep("smoke-health — GET /healthz");
const baseUrl = getRequiredEnv("MCP_REMOTE_URL");
const url = baseUrl.replace(/\/$/, "") + "/healthz";

const { status, json, raw } = await requestJson(url);

if (status !== 200) {
  printFail(`Expected HTTP 200, got ${status}`);
  console.error(`  Response: ${raw}`);
  process.exit(1);
}

if (!json || json.ok !== true) {
  printFail(`Expected ok: true`);
  process.exit(1);
}

if (json.service !== "eventicious-mcp-remote") {
  printFail(`Expected service "eventicious-mcp-remote", got "${json.service}"`);
  process.exit(1);
}

if (!json.version) {
  printFail("Missing version field");
  process.exit(1);
}

printPass(`HTTP 200 ok: true, service=${json.service}, version=${json.version}`);
