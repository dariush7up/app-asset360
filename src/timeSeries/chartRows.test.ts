import { describe, expect, it } from 'vitest';

import { seriesKey, toChartRows } from './chartRows';

const REF = { space: 'sp', externalId: 'x' };

describe(toChartRows.name, () => {
  it('merges series by timestamp, one value key per series, sorted by time', () => {
    const rows = toChartRows([
      { ref: REF, hasData: true, points: [{ timestamp: 2, value: 20 }, { timestamp: 1, value: 10 }] },
      { ref: REF, hasData: true, points: [{ timestamp: 2, value: 200 }, { timestamp: 3, value: 300 }] },
    ]);

    expect(rows).toEqual([
      { timestamp: 1, s0: 10 },
      { timestamp: 2, s0: 20, s1: 200 },
      { timestamp: 3, s1: 300 },
    ]);
  });

  it('returns no rows when no series has data', () => {
    expect(toChartRows([{ ref: REF, hasData: false, points: [] }])).toEqual([]);
    expect(toChartRows([])).toEqual([]);
  });

  it('names value keys by series position', () => {
    expect(seriesKey(2)).toBe('s2');
  });
});
