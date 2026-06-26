import { eventiciousRequest } from "../eventicious-client";
import { extractEventiciousCredentials } from "../auth";

export async function getAclGroups(request: Request) {
  try {
    const credentials = extractEventiciousCredentials(request);
    const res = await eventiciousRequest({ method: "GET", endpoint: "/api/external/v2/aclgroups", credentials });
    return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
  } catch (e) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
  }
}

export async function createAclGroup(request: Request, params: {
  id: number;
  name: string;
  dry_run?: boolean;
  confirm?: boolean;
}) {
  if (!params.dry_run && !params.confirm) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
  }
  if (params.dry_run) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/aclgroups/create", payload: { id: params.id, name: params.name } }) }] };
  }
  try {
    const credentials = extractEventiciousCredentials(request);
    const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/aclgroups/create", body: { id: params.id, name: params.name }, credentials });
    return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
  } catch (e) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
  }
}

export async function moveUsersToGroups(request: Request, params: {
  userIds: number[];
  groupIdsAddTo: number[];
  groupIdsRemoveFrom: number[];
  dry_run?: boolean;
  confirm?: boolean;
}) {
  if (!params.dry_run && !params.confirm) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "confirm=true required" }) }], isError: true };
  }
  const payload = { userIds: params.userIds, groupIdsAddTo: params.groupIdsAddTo, groupIdsRemoveFrom: params.groupIdsRemoveFrom };
  if (params.dry_run) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, endpoint: "POST /api/external/v2/aclgroups/users/move", payload }) }] };
  }
  try {
    const credentials = extractEventiciousCredentials(request);
    const res = await eventiciousRequest({ method: "POST", endpoint: "/api/external/v2/aclgroups/users/move", body: payload, credentials });
    return { content: [{ type: "text" as const, text: JSON.stringify(res.data) }] };
  } catch (e) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }) }], isError: true };
  }
}
