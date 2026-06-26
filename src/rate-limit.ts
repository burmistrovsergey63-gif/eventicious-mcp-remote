import { logger } from "./logger";

const MAX_USERS_PER_REQUEST = 200;

export function guardUserBatchSize(userIds: number[] | { id: number }[]): void {
  const count = Array.isArray(userIds) ? userIds.length : 0;
  if (count > MAX_USERS_PER_REQUEST) {
    throw new Error(
      `Batch size ${count} exceeds maximum ${MAX_USERS_PER_REQUEST} users per request`
    );
  }
}

export function warnAutoPublishRateLimit(toolName: string): void {
  logger.warn("rate_limit_notice", {
    tool: toolName,
    message:
      "Eventicious auto-publish limits user write operations to 10 requests/minute. Implement client-side throttling before production use.",
  });
}
