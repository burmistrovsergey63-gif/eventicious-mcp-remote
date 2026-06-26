import { eventiciousRequest } from "../eventicious-client";
import { extractEventiciousCredentials } from "../auth";
import { config } from "../config";

export async function createUsers(request: Request, params: {
  users: Array<{ id: number; firstName: string; lastName: string; [key: string]: unknown }>;
  dry_run?: boolean;
  confirm?: boolean;
}) {
  if (!params.dry_run && !params.confirm) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
  }
  if (params.users.length > config.maxUsersPerRequest) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Max ${config.maxUsersPerRequest} users per request` }) }], isError: true };
  }
  if (params.dry_run) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/users/create", payload: { users: params.users } }) }] };
  }
  try {
    const credentials = extractEventiciousCredentials(request);
    const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/users/create", body: { users: params.users }, credentials });
    return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
  } catch (e) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
  }
}

export async function updateUsers(request: Request, params: {
  users: Array<{ id: number; [key: string]: unknown }>;
  dry_run?: boolean;
  confirm?: boolean;
}) {
  if (!params.dry_run && !params.confirm) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
  }
  if (params.users.length > config.maxUsersPerRequest) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Max ${config.maxUsersPerRequest} users per request` }) }], isError: true };
  }
  if (params.dry_run) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "PATCH /api/external/v2/users/update", payload: { users: params.users } }) }] };
  }
  try {
    const credentials = extractEventiciousCredentials(request);
    const res = await eventiciousRequest({ method: "PATCH", endpoint: "/api/external/v2/users/update", body: { users: params.users }, credentials });
    return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
  } catch (e) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
  }
}

export async function blockUsers(request: Request, params: {
  userIds: number[];
  dry_run?: boolean;
  confirm?: boolean;
}) {
  if (!params.dry_run && !params.confirm) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
  }
  if (params.dry_run) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/users/block", payload: { userIds: params.userIds } }) }] };
  }
  try {
    const credentials = extractEventiciousCredentials(request);
    const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/users/block", body: { userIds: params.userIds }, credentials });
    return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
  } catch (e) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
  }
}

export async function unblockUsers(request: Request, params: {
  userIds: number[];
  dry_run?: boolean;
  confirm?: boolean;
}) {
  if (!params.dry_run && !params.confirm) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
  }
  if (params.dry_run) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/users/unblock", payload: { userIds: params.userIds } }) }] };
  }
  try {
    const credentials = extractEventiciousCredentials(request);
    const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/users/unblock", body: { userIds: params.userIds }, credentials });
    return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
  } catch (e) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
  }
}
