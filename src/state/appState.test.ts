import { describe, expect, it } from 'vitest';

import { DEFAULT_APP_STATE, parseAppState } from './appState';

describe(parseAppState.name, () => {
  it('returns defaults when there is no saved state', () => {
    expect(parseAppState(undefined)).toEqual(DEFAULT_APP_STATE);
  });

  it('plots nothing by default', () => {
    expect(DEFAULT_APP_STATE.seriesIds).toEqual([]);
  });

  it('restores query, asset, chosen series, work order, file and range', () => {
    const ref = { space: 's', externalId: 'a' };
    const other = { space: 's', externalId: 'b' };

    const state = parseAppState(
      JSON.stringify({ query: 'pump', asset: ref, seriesIds: [ref, other], workOrderId: ref, fileId: other, range: '7d' })
    );

    expect(state).toEqual({
      query: 'pump',
      asset: ref,
      seriesIds: [ref, other],
      workOrderId: ref,
      fileId: other,
      range: '7d',
    });
  });

  it('falls back to defaults for malformed JSON and invalid fields', () => {
    expect(parseAppState('{not json')).toEqual(DEFAULT_APP_STATE);
    expect(parseAppState('[]')).toEqual(DEFAULT_APP_STATE);
    expect(parseAppState(JSON.stringify({ range: '5y', asset: { space: 's' }, seriesIds: 'x' }))).toEqual(
      DEFAULT_APP_STATE
    );
  });

  it('drops invalid entries from the chosen series list', () => {
    const state = parseAppState(JSON.stringify({ seriesIds: [{ space: 's', externalId: 'a' }, { space: 's' }, 'x'] }));

    expect(state.seriesIds).toEqual([{ space: 's', externalId: 'a' }]);
  });
});
