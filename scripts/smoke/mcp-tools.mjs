import { getRequiredEnv, requestJson, printStep, printPass, printFail } from "./utils.mjs";

printStep("smoke-mcp-tools — GET /mcp/tools");
const BASE_TOOL_COUNT = 75;

const baseUrl = getRequiredEnv("MCP_REMOTE_URL");
const url = baseUrl.replace(/\/$/, "") + "/mcp/tools";

const { status, json, raw } = await requestJson(url);

if (status !== 200) {
  printFail(`Expected HTTP 200, got ${status}`);
  console.error(`  Response: ${raw}`);
  process.exit(1);
}

if (!json) {
  printFail("Response is not valid JSON");
  process.exit(1);
}

const required = ["service", "version", "toolCount", "tools"];
for (const key of required) {
  if (!json[key]) {
    printFail(`Missing field: ${key}`);
    process.exit(1);
  }
}

if (json.service !== "eventicious-mcp-remote") {
  printFail(`Expected service "eventicious-mcp-remote", got "${json.service}"`);
  process.exit(1);
}

if (json.toolCount !== BASE_TOOL_COUNT) {
  printFail(`Expected toolCount ${BASE_TOOL_COUNT}, got ${json.toolCount}`);
  process.exit(1);
}

if (!Array.isArray(json.tools) || json.tools.length !== BASE_TOOL_COUNT) {
  printFail(`Expected ${BASE_TOOL_COUNT} tools, got ${json.tools?.length || 0}`);
  process.exit(1);
}

const names = json.tools.map(t => t.name);
const unique = new Set(names);
if (unique.size !== names.length) {
  printFail("Tool names are not unique");
  process.exit(1);
}

if (!names.includes("eventicious_auth_check")) {
  printFail("Missing eventicious_auth_check");
  process.exit(1);
}

if (!names.includes("eventicious_get_agent_instructions")) {
  printFail("Missing eventicious_get_agent_instructions");
  process.exit(1);
}

printPass(`HTTP 200 toolCount=${json.toolCount} tools=${json.tools.length} allUnique`);
