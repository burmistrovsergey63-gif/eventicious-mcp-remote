import { getRequiredEnv, requestJson, printStep, printPass, printFail } from "./utils.mjs";

printStep("smoke-mcp-info — GET /mcp");
const baseUrl = getRequiredEnv("MCP_REMOTE_URL");
const url = baseUrl.replace(/\/$/, "") + "/mcp";

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

const required = ["service", "protocol", "endpoint", "version"];
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

if (json.protocol !== "mcp") {
  printFail(`Expected protocol "mcp", got "${json.protocol}"`);
  process.exit(1);
}

printPass(`HTTP 200 service=${json.service} protocol=${json.protocol} endpoint=${json.endpoint} version=${json.version}`);
