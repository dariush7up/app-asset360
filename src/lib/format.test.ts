import { describe, expect, it } from 'vitest';

import { formatDateTime, formatTime } from './format';

describe('format', () => {
  it('formats a date and time with the day, month and year', () => {
    expect(formatDateTime(Date.UTC(2019, 4, 29, 9, 0))).toMatch(/29 May 2019/);
  });

  it('formats a time of day', () => {
    expect(formatTime(Date.UTC(2019, 4, 29, 9, 5))).toMatch(/\d{1,2}:05/);
  });

  it('returns a dash for NaN, Infinity and -Infinity instead of throwing', () => {
    expect(formatDateTime(NaN)).toBe('-');
    expect(formatDateTime(Infinity)).toBe('-');
    expect(formatDateTime(-Infinity)).toBe('-');
    expect(formatTime(NaN)).toBe('-');
    expect(formatTime(Infinity)).toBe('-');
  });
});
