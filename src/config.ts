export const config = {
  mcpAccessToken: process.env.MCP_ACCESS_TOKEN || "",
  defaultBaseUrl:
    process.env.EVENTICIOUS_DEFAULT_BASE_URL ||
    "https://api-integration.eventicious.ru",
  dryRunDefault: process.env.DRY_RUN_DEFAULT !== "false",
  tokenCacheTtlMs: 50 * 60 * 1000, // 50 minutes
  maxUsersPerRequest: 200,
};
