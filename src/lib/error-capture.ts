import { consumeRequestError, recordRequestError } from "./request-context.ts";

const TTL_MS = 5_000;
const CAUSE_DEPTH_LIMIT = 5;
const DESCRIPTION_LENGTH_LIMIT = 8_000;

let fallbackError: { error: unknown; at: number } | undefined;

function record(error: unknown) {
  if (recordRequestError(error)) return;
  fallbackError = { error, at: Date.now() };
}

export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(typeof current === "string" ? current : safeStringify(current));
      break;
    }
    const label = depth === 0 ? "" : "caused by: ";
    const status = describeStatus(current);
    parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
    current = current.cause;
  }
  return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}

function describeStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? ` (status ${value})` : "";
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

const isServer = typeof window === "undefined";

if (isServer) {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      const expanded = args.map((arg) => {
        if (!isErrorLike(arg)) return arg;
        record(arg);
        return describeError(arg);
      });
      originalConsoleError(...expanded);
    } catch (processingError) {
      originalConsoleError(...args, `[error-capture failed: ${String(processingError)}]`);
    }
  };
}

export function consumeLastCapturedError(): unknown {
  const fromRequest = consumeRequestError();
  if (fromRequest !== undefined) return fromRequest;
  if (!fallbackError) return undefined;
  if (Date.now() - fallbackError.at > TTL_MS) {
    fallbackError = undefined;
    return undefined;
  }
  const { error } = fallbackError;
  fallbackError = undefined;
  return error;
}

export function recordCapturedError(error: unknown) {
  record(error);
}
