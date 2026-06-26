const SENSITIVE_KEYS = [
  "client_secret",
  "authorization",
  "bearer",
  "token",
  "password",
  "secret",
  "access_token",
];

function maskValue(key: string, value: unknown): unknown {
  if (typeof value !== "string") return value;
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.some((k) => lower.includes(k))) {
    if (value.length < 8) return "***";
    return value.slice(0, 3) + "***" + value.slice(-3);
  }
  return value;
}

function maskObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out[k] = maskObject(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item !== null && typeof item === "object"
          ? maskObject(item as Record<string, unknown>)
          : item
      );
    } else {
      out[k] = maskValue(k, v);
    }
  }
  return out;
}

function log(level: string, event: string, meta?: Record<string, unknown>) {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    event,
  };
  if (meta && Object.keys(meta).length > 0) {
    entry.meta = maskObject(meta);
  }
  console.log(JSON.stringify(entry));
}

export const logger = {
  info(event: string, meta?: Record<string, unknown>) {
    log("info", event, meta);
  },
  warn(event: string, meta?: Record<string, unknown>) {
    log("warn", event, meta);
  },
  error(event: string, meta?: Record<string, unknown>) {
    log("error", event, meta);
  },
};
