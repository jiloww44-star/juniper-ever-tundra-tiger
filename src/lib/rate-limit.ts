export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
  limit: number;
};

export type RateLimiter = {
  limit: (key: string, now?: number) => RateLimitResult;
  reset: () => void;
  size: () => number;
};

/**
 * In-memory sliding-window limiter. Good enough for a single Node isolate
 * (preview + typical Vercel instances). Does not require Redis.
 */
export function createRateLimiter(opts: {
  max: number;
  windowMs: number;
  maxKeys?: number;
}): RateLimiter {
  const hits = new Map<string, number[]>();
  const maxKeys = opts.maxKeys ?? 10_000;

  function prune(key: string, now: number): number[] {
    const windowStart = now - opts.windowMs;
    const next = (hits.get(key) ?? []).filter((t) => t > windowStart);
    if (next.length === 0) hits.delete(key);
    else hits.set(key, next);
    return next;
  }

  return {
    limit(key: string, now = Date.now()): RateLimitResult {
      if (hits.size > maxKeys) {
        const oldest = hits.keys().next().value;
        if (oldest !== undefined) hits.delete(oldest);
      }
      const recent = prune(key, now);
      if (recent.length >= opts.max) {
        const retryAfterMs = Math.max(0, (recent[0] ?? now) + opts.windowMs - now);
        return { ok: false, remaining: 0, retryAfterMs, limit: opts.max };
      }
      recent.push(now);
      hits.set(key, recent);
      return {
        ok: true,
        remaining: Math.max(0, opts.max - recent.length),
        retryAfterMs: 0,
        limit: opts.max,
      };
    },
    reset() {
      hits.clear();
    },
    size() {
      return hits.size;
    },
  };
}

export const aiCopyLimiter = createRateLimiter({
  max: 10,
  windowMs: 60 * 60 * 1000,
});

export const auditLeadLimiter = createRateLimiter({
  max: 5,
  windowMs: 60 * 60 * 1000,
});

export const auditSubmissionLimiter = createRateLimiter({
  max: 10,
  windowMs: 60 * 60 * 1000,
});
