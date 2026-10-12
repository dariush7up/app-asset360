import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeWrapper } from '../__mocks__/renderWithApp';

import type { RecentAssetsStore } from './RecentAssets';
import { useRecentAssetsViewModel } from './useRecentAssetsViewModel';

const PUMP = { ref: { space: 'sp', externalId: 'pump' }, tag: 'pump', name: 'PUMP-101', viewedAt: 1 };

describe(useRecentAssetsViewModel.name, () => {
  it('lists the recently viewed assets from the store', () => {
    const { result } = renderHook(() => useRecentAssetsViewModel(), {
      wrapper: makeWrapper(undefined, undefined, undefined, undefined, { list: () => [PUMP], record: vi.fn() }),
    });

    expect(result.current.recent).toEqual([PUMP]);
  });

  it('opens an asset and syncs the selection to the host', async () => {
    const sync = vi.fn(() => Promise.resolve(true));
    const store: RecentAssetsStore = { list: () => [PUMP], record: vi.fn() };
    const { result } = renderHook(() => useRecentAssetsViewModel(), {
      wrapper: makeWrapper(undefined, undefined, sync, undefined, store),
    });

    act(() => result.current.open(PUMP.ref));

    await waitFor(() => expect(sync).toHaveBeenCalledWith(expect.stringContaining('"externalId":"pump"')));
  });
});
