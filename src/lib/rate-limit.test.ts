import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRateLimiter } from "./rate-limit.ts";

describe("createRateLimiter", () => {
  it("allows up to max hits in the window", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1_000 });
    const t0 = 1_000_000;
    assert.equal(limiter.limit("a", t0).ok, true);
    assert.equal(limiter.limit("a", t0 + 1).ok, true);
    assert.equal(limiter.limit("a", t0 + 2).ok, true);
    const blocked = limiter.limit("a", t0 + 3);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterMs > 0);
  });

  it("does not leak hits across keys", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1_000 });
    assert.equal(limiter.limit("one", 0).ok, true);
    assert.equal(limiter.limit("two", 0).ok, true);
  });

  it("resets after the window", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 100 });
    assert.equal(limiter.limit("a", 0).ok, true);
    assert.equal(limiter.limit("a", 50).ok, false);
    assert.equal(limiter.limit("a", 101).ok, true);
  });
});
