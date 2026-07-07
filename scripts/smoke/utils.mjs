export function getRequiredEnv(name) {
  const val = process.env[name];
  if (!val || val.trim() === "") {
    console.error(`  Missing required env var: ${name}`);
    return process.exit(1);
  }
  return val.trim();
}

export function getOptionalEnv(name) {
  return process.env[name]?.trim() || null;
}

export function maskSecret(val) {
  if (!val || typeof val !== "string") return "(empty)";
  if (val.length <= 8) return "****";
  return val.slice(0, 4) + "****" + val.slice(-4);
}

export function safeJsonParse(text) {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, data: null };
  }
}

export function printStep(msg) {
  console.log(`[smoke] ${msg}`);
}

export function printPass(msg) {
  console.log(`  ✔ ${msg}`);
}

export function printFail(msg) {
  console.error(`  ✖ ${msg}`);
}

export async function requestJson(url, options = {}) {
  const { method = "GET", headers = {}, body } = options;
  const fetchHeaders = { Accept: "application/json", ...headers };
  if (body) {
    fetchHeaders["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const parsed = safeJsonParse(text);
  return { status: res.status, ok: res.ok, json: parsed.ok ? parsed.data : null, raw: text };
}
