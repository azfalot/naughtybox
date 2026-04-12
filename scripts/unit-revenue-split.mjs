/**
 * Unit tests for revenue-split calculations.
 *
 * The platform keeps PLATFORM_FEE_RATE of every token transaction and
 * credits the creator with the remainder.  All arithmetic must be integer
 * (no fractional tokens are issued).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Pure revenue-split helper (mirrors the logic used by WalletService)
// ---------------------------------------------------------------------------

const PLATFORM_FEE_RATE = 0.2; // 20 % platform cut

/**
 * Returns how many tokens the creator receives for a given tip/payment.
 * Uses Math.floor so the platform always gets at least its cut.
 */
function creatorShare(grossAmount) {
  if (!Number.isInteger(grossAmount) || grossAmount <= 0) {
    throw new RangeError('grossAmount must be a positive integer');
  }
  return Math.floor(grossAmount * (1 - PLATFORM_FEE_RATE));
}

/**
 * Returns the platform's fee for a given gross amount.
 * = grossAmount - creatorShare  (guarantees the split sums to grossAmount)
 */
function platformFee(grossAmount) {
  return grossAmount - creatorShare(grossAmount);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('creatorShare', () => {
  it('creator receives 80 % of a round amount', () => {
    assert.equal(creatorShare(100), 80);
  });

  it('creator receives correct share for an odd amount (floor applied)', () => {
    // 15 * 0.8 = 12.0  → no rounding needed
    assert.equal(creatorShare(15), 12);
  });

  it('platform fee + creator share always equals gross amount', () => {
    for (const amount of [1, 7, 13, 50, 99, 100, 250, 1000]) {
      assert.equal(platformFee(amount) + creatorShare(amount), amount, `sum mismatch for amount=${amount}`);
    }
  });

  it('minimum tip of 1 token gives creator 0 tokens (floor of 0.8)', () => {
    // 1 * 0.8 = 0.8 → Math.floor → 0 (platform absorbs the fraction).
    // The UI/API layer should enforce a minimum tip amount large enough that
    // the creator always receives at least 1 token (e.g. minimum tip = 2).
    assert.equal(creatorShare(1), 0);
  });

  it('throws for zero amount', () => {
    assert.throws(() => creatorShare(0), RangeError);
  });

  it('throws for negative amount', () => {
    assert.throws(() => creatorShare(-5), RangeError);
  });

  it('throws for non-integer amount', () => {
    assert.throws(() => creatorShare(9.5), RangeError);
  });
});

describe('platformFee', () => {
  it('platform keeps 20 % of a round amount', () => {
    assert.equal(platformFee(100), 20);
  });

  it('platform fee is never negative', () => {
    for (const amount of [1, 2, 5, 10, 100]) {
      assert.ok(platformFee(amount) >= 0, `negative fee for amount=${amount}`);
    }
  });
});
