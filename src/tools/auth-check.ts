import { eventiciousRequest } from "../eventicious-client";
import { extractEventiciousCredentials } from "../auth";

export async function authCheck(request: Request) {
  const credentials = extractEventiciousCredentials(request);
  try {
    await eventiciousRequest({
      method: "GET",
      endpoint: "/api/external/v2/aclgroups",
      credentials,
    });
    return { content: [{ type: "text" as const, text: JSON.stringify({ success: true, message: "Credentials valid" }) }] };
  } catch (e) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }) }],
      isError: true,
    };
  }
}
