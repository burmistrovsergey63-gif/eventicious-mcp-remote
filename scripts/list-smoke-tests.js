const fs = require("fs");
const path = require("path");

const scriptsDir = path.join(__dirname, "..", "scripts");
const smokeScripts = fs.readdirSync(scriptsDir)
  .filter(f => f.endsWith(".ps1") && f.includes("smoke"));

console.log("Available smoke test scripts:\n");
smokeScripts.forEach((script, i) => {
   console.log(`${i + 1}. scripts/${script}`);
});
console.log("\nnpm scripts:");
console.log("  npm run smoke:list    - List available smoke test scripts");
console.log("  npm run smoke:tools   - Verify exactly 74 MCP tools are registered");
console.log("  npm run smoke:remote  - Test remote deployment (requires MCP_REMOTE_URL env)");
console.log("\nNote: Tests use dry_run=true by default. Review scripts before running with real credentials.");