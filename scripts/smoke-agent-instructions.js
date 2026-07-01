const fs = require("fs");
const path = require("path");

function main() {
  console.log("Agent instructions smoke check");
  console.log("===============================");

  const transportPath = path.join(__dirname, "..", "src", "mcp", "transport.ts");
  const content = fs.readFileSync(transportPath, "utf-8");

  const checks = [
    { name: "tool is registered", ok: content.includes('"eventicious_get_agent_instructions"') },
    { name: "contains mcpVersion", ok: content.includes("mcpVersion") },
    { name: "contains expectedToolsCount 75", ok: /expectedToolsCount:\s*75/.test(content) },
    { name: "contains UTF-8 guidance", ok: content.includes("useUtf8: true") },
    { name: "contains PowerShell 5.1 warning", ok: content.includes("doNotUsePowerShell51BodyAsStringForJsonWithCyrillic") },
    { name: "contains dry_run rules", ok: content.includes("useDryRunBeforeWrites: true") },
    { name: "contains confirm rules", ok: content.includes("realChangesOnlyAfterDryRunFalseAndConfirmTrue") },
    { name: "contains danger_confirm rules", ok: content.includes("destructiveOperationsRequireDangerConfirm: true") },
    { name: "prepare tools are safe", ok: content.includes("prepareToolsAreSafe") },
    { name: "safeReadOnlyCategories defined", ok: content.includes("safeReadOnlyCategories") },
  ];

  let allPassed = true;

  for (const check of checks) {
    const status = check.ok ? "PASS" : "FAIL";
    console.log(`  ${status}: ${check.name}`);
    if (!check.ok) allPassed = false;
  }

  console.log("");
  if (allPassed) {
    console.log("PASS: All agent instructions checks passed");
  } else {
    console.error("FAIL: Some agent instructions checks failed");
    process.exit(1);
  }
}

main();
