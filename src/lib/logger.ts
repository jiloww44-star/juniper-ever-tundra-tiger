const REDACT_KEYS = /api[-_]?key|authorization|secret|password|token|cookie/i;
const MAX_VALUE = 2_000;

function redact(value: unknown, key?: string): unknown {
  if (key && REDACT_KEYS.test(key)) return "[redacted]";
  if (typeof value === "string") {
    if (value.length > MAX_VALUE) return `${value.slice(0, MAX_VALUE)}…`;
    return value;
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack?.slice(0, 2_000) };
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 30)) {
      out[k] = redact(v, k);
    }
    return out;
  }
  return value;
}

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  const payload = JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(context ? (redact(context) as Record<string, unknown>) : {}),
  });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
};
