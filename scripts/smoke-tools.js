const EXPECTED_TOOL_COUNT = 75;

function countToolCalls(content) {
  const matches = content.match(/server\.tool\(/g);
  return matches ? matches.length : 0;
}

function main() {
  console.log("Tool-count smoke check");
  console.log("====================");
  console.log(`Expected: ${EXPECTED_TOOL_COUNT}`);

  const fs = require("fs");
  const path = require("path");

  const transportPath = path.join(__dirname, "..", "src", "mcp", "transport.ts");
  const toolsDir = path.join(__dirname, "..", "src", "tools");

  let totalTools = 0;
  const toolNames = [];

  const transportContent = fs.readFileSync(transportPath, "utf-8");
  const transportMatches = transportContent.matchAll(/server\.tool\(\s*["']([^"']+)["']/g);
  for (const match of transportMatches) {
    toolNames.push(match[1]);
  }

  const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith(".ts"));
  for (const file of toolFiles) {
    const content = fs.readFileSync(path.join(toolsDir, file), "utf-8");
    const matches = content.matchAll(/server\.tool\(\s*["']([^"']+)["']/g);
    for (const match of matches) {
      toolNames.push(match[1]);
      totalTools++;
    }
  }

  const actualCount = toolNames.length;

  console.log(`Actual: ${actualCount}`);

  if (actualCount < EXPECTED_TOOL_COUNT) {
    console.error(`\nFAIL: Missing ${EXPECTED_TOOL_COUNT - actualCount} tools`);
    process.exit(1);
  }

  if (actualCount > EXPECTED_TOOL_COUNT) {
    console.error(`\nFAIL: Extra ${actualCount - EXPECTED_TOOL_COUNT} tools`);
    process.exit(1);
  }

  console.log("\nPASS: Tool count matches expected");
  console.log("\nRegistered tools (" + toolNames.length + "):");
  toolNames.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
}

main();