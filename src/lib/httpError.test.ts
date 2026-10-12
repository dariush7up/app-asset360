import { describe, expect, it } from 'vitest';

import { isForbidden, statusOf } from './httpError';

describe(statusOf.name, () => {
  it('reads the status of an SDK-style error', () => {
    expect(statusOf({ status: 429 })).toBe(429);
  });

  it('returns undefined for errors without a numeric status', () => {
    expect(statusOf(new Error('boom'))).toBeUndefined();
    expect(statusOf({ status: '403' })).toBeUndefined();
    expect(statusOf(null)).toBeUndefined();
  });
});

describe(isForbidden.name, () => {
  it.each([401, 403])('treats %i as no access', (status) => {
    expect(isForbidden({ status })).toBe(true);
  });

  it.each([400, 404, 500])('does not treat %i as no access', (status) => {
    expect(isForbidden({ status })).toBe(false);
  });
});
