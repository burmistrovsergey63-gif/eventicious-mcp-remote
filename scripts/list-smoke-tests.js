const fs = require("fs");
const path = require("path");

const scriptsDir = path.join(__dirname, "..", "scripts");
const smokeScripts = fs.readdirSync(scriptsDir)
  .filter(f => f.endsWith(".ps1") && f.includes("smoke"));

console.log("Available smoke test scripts:\n");
smokeScripts.forEach((script, i) => {
   console.log(`${i + 1}. scripts/${script}`);
});

const smokeNodeDir = path.join(scriptsDir, "smoke");
const nodeScripts = fs.existsSync(smokeNodeDir)
  ? fs.readdirSync(smokeNodeDir).filter(f => f.endsWith(".mjs") && f !== "utils.mjs")
  : [];

console.log("\nCross-platform Node.js smoke checks:");
nodeScripts.forEach((script, i) => {
   console.log(`  scripts/smoke/${script}`);
});

console.log("\nnpm scripts:");
console.log("  npm run smoke:list        - List available smoke test scripts");
console.log("  npm run smoke:tools       - Verify exactly 75 MCP tools are registered (no env)");
console.log("  npm run smoke:health      - GET /healthz (requires MCP_REMOTE_URL)");
console.log("  npm run smoke:mcp-info    - GET /mcp info (requires MCP_REMOTE_URL)");
console.log("  npm run smoke:remote      - Test remote MCP endpoint (requires MCP_REMOTE_URL + MCP_ACCESS_TOKEN)");
console.log("  npm run smoke:remote-tools - POST /mcp initialize+tools/list (requires MCP_REMOTE_URL + MCP_ACCESS_TOKEN)");
console.log("  npm run smoke:auth        - Test auth exchange (requires Eventicious credentials)");
console.log("  npm run smoke:auth-verify - GET /auth/verify (requires MCP_REMOTE_URL + MCP_ACCESS_TOKEN)");
console.log("\nEnv requirements:");
console.log("  No env:      smoke:tools");
console.log("  MCP_REMOTE_URL: smoke:health, smoke:mcp-info");
console.log("  MCP_REMOTE_URL + MCP_ACCESS_TOKEN: smoke:remote, smoke:remote-tools, smoke:auth-verify");
console.log("  Eventicious creds: smoke:auth");
console.log("\nNote: Tests use dry_run=true by default. Review scripts before running with real credentials.");
