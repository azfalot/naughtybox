/**
 * Unit tests for the in-memory rate-limiter logic.
 *
 * The strategy: sliding-window counter per key.  A fixed number of requests
 * (LIMIT) are allowed within a rolling TIME_WINDOW_MS.  Once the budget is
 * exhausted the limiter returns { allowed: false } until old hits fall outside
 * the window.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Minimal sliding-window rate-limiter (pure JS, no I/O)
// ---------------------------------------------------------------------------

function createRateLimiter({ limit, windowMs }) {
  /** @type {Map<string, number[]>} key → sorted list of hit timestamps */
  const store = new Map();

  return {
    /**
     * Record a hit for `key` at `nowMs` and decide whether it is allowed.
     * @param {string} key
     * @param {number} nowMs – current time in milliseconds (injectable for tests)
     * @returns {{ allowed: boolean, remaining: number }}
     */
    check(key, nowMs = Date.now()) {
      const cutoff = nowMs - windowMs;
      const hits = (store.get(key) ?? []).filter((t) => t > cutoff);

      if (hits.length >= limit) {
        store.set(key, hits);
        return { allowed: false, remaining: 0 };
      }

      hits.push(nowMs);
      store.set(key, hits);
      return { allowed: true, remaining: limit - hits.length };
    },

    /** Flush all recorded hits (useful in tests). */
    reset() {
      store.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const LIMIT = 3;
const WINDOW_MS = 1_000; // 1 second

describe('RateLimiter', () => {
  let limiter;
  const key = 'user-42';
  const t0 = 1_000_000; // arbitrary fixed base time

  beforeEach(() => {
    limiter = createRateLimiter({ limit: LIMIT, windowMs: WINDOW_MS });
  });

  it('allows the first request', () => {
    const result = limiter.check(key, t0);
    assert.equal(result.allowed, true);
  });

  it('allows up to the limit within the window', () => {
    for (let i = 0; i < LIMIT; i++) {
      assert.equal(limiter.check(key, t0 + i).allowed, true, `request ${i + 1} should be allowed`);
    }
  });

  it('blocks the (limit + 1)th request within the window', () => {
    for (let i = 0; i < LIMIT; i++) limiter.check(key, t0 + i);
    const result = limiter.check(key, t0 + LIMIT);
    assert.equal(result.allowed, false);
    assert.equal(result.remaining, 0);
  });

  it('allows a new request once old hits slide out of the window', () => {
    for (let i = 0; i < LIMIT; i++) limiter.check(key, t0 + i);
    // Move time forward past the window so all previous hits expire
    const result = limiter.check(key, t0 + WINDOW_MS + 1);
    assert.equal(result.allowed, true);
  });

  it('tracks different keys independently', () => {
    const otherKey = 'user-99';
    for (let i = 0; i < LIMIT; i++) limiter.check(key, t0 + i);

    // key is now exhausted, but otherKey should still be free
    assert.equal(limiter.check(key, t0 + LIMIT).allowed, false);
    assert.equal(limiter.check(otherKey, t0 + LIMIT).allowed, true);
  });

  it('remaining decrements correctly', () => {
    const r0 = limiter.check(key, t0);
    assert.equal(r0.remaining, LIMIT - 1);

    const r1 = limiter.check(key, t0 + 1);
    assert.equal(r1.remaining, LIMIT - 2);
  });

  it('reset clears state for all keys', () => {
    for (let i = 0; i < LIMIT; i++) limiter.check(key, t0 + i);
    limiter.reset();
    assert.equal(limiter.check(key, t0 + LIMIT).allowed, true);
  });
});
