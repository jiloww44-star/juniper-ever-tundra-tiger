import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  requestId: string;
  error?: unknown;
  at: number;
};

const storage = new AsyncLocalStorage<RequestContext>();

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function runWithRequestContext<T>(requestId: string, fn: () => T): T {
  return storage.run({ requestId, at: Date.now() }, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

export function recordRequestError(error: unknown) {
  const store = storage.getStore();
  if (!store) return false;
  store.error = error;
  store.at = Date.now();
  return true;
}

export function consumeRequestError(): unknown {
  const store = storage.getStore();
  if (!store?.error) return undefined;
  const error = store.error;
  store.error = undefined;
  return error;
}
