import { describe, expect, it } from 'vitest';

import { retryDelay, shouldRetry } from './retryPolicy';

describe(shouldRetry.name, () => {
  it.each([429, 408, 500, 503])('retries status %i', (status) => {
    expect(shouldRetry(0, { status })).toBe(true);
  });

  it.each([400, 401, 403, 404, 422])('does not retry status %i', (status) => {
    expect(shouldRetry(0, { status })).toBe(false);
  });

  it('retries errors without a status, such as network failures', () => {
    expect(shouldRetry(0, new Error('Failed to fetch'))).toBe(true);
  });

  it('stops after three retries', () => {
    expect(shouldRetry(2, { status: 429 })).toBe(true);
    expect(shouldRetry(3, { status: 429 })).toBe(false);
  });
});

describe(retryDelay.name, () => {
  it('grows exponentially, between half and the full step', () => {
    expect(retryDelay(0, {}, () => 0)).toBe(250);
    expect(retryDelay(0, {}, () => 1)).toBe(500);
    expect(retryDelay(2, {}, () => 1)).toBe(2000);
  });

  it('caps the delay', () => {
    expect(retryDelay(20, {}, () => 1)).toBe(10_000);
  });

  it('never waits less than Retry-After', () => {
    expect(retryDelay(0, { headers: { 'retry-after': '5' } }, () => 0)).toBe(5000);
  });

  it('caps an excessive Retry-After and ignores an invalid one', () => {
    expect(retryDelay(0, { headers: { 'retry-after': '600' } }, () => 0)).toBe(30_000);
    expect(retryDelay(0, { headers: { 'retry-after': 'soon' } }, () => 0)).toBe(250);
  });
});
