import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeRecentStore, makeServices, makeWrapper } from '../__mocks__/renderWithApp';

import type { Asset, AssetDetails } from './AssetService';
import { useAssetViewModel } from './useAssetViewModel';

const PUMP: Asset = { ref: { space: 'sp', externalId: 'pump' }, tag: 'pump', name: 'PUMP-101', aliases: [], path: [] };
const SELECTED = JSON.stringify({ asset: PUMP.ref });

describe(useAssetViewModel.name, () => {
  it('has nothing selected and loads nothing by default', () => {
    const retrieve = vi.fn();
    const { result } = setup({ retrieve });

    expect(result.current).toMatchObject({ selected: null, details: null, isLoading: false, notFound: false });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it('loads the selected asset', async () => {
    const { result } = setup({}, SELECTED);

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.details?.asset.name).toBe('PUMP-101'));
  });

  it('records every opened asset in the recently viewed list', async () => {
    const store = makeRecentStore();
    setup({}, SELECTED, undefined, store);

    await waitFor(() => expect(store.recorded).toHaveLength(1));
    expect(store.recorded[0]).toMatchObject({ tag: 'pump', name: 'PUMP-101', ref: PUMP.ref });
  });

  it('reports an asset that does not exist and does not record it', async () => {
    const store = makeRecentStore();
    const { result } = setup({ retrieve: () => Promise.resolve(null) }, SELECTED, undefined, store);

    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(store.recorded).toHaveLength(0);
  });

  it('exposes the load error and retries on request', async () => {
    const retrieve = vi
      .fn<() => Promise<AssetDetails | null>>()
      .mockRejectedValueOnce(Object.assign(new Error('asset failed'), { status: 500 }))
      .mockResolvedValueOnce({ asset: PUMP, ancestors: [] });
    const { result } = setup({ retrieve }, SELECTED);

    await waitFor(() => expect(result.current.error?.message).toBe('asset failed'));
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.details?.asset.name).toBe('PUMP-101'));
  });

  it('syncs opening and closing an asset to the host and clears the chosen series', async () => {
    const sync = vi.fn(() => Promise.resolve(true));
    const { result } = setup({}, JSON.stringify({ seriesIds: [PUMP.ref] }), sync);

    act(() => result.current.open(PUMP.ref));
    await waitFor(() => expect(result.current.selected).toEqual(PUMP.ref));
    expect(sync).toHaveBeenLastCalledWith(expect.stringContaining('"seriesIds":[]'));

    act(() => result.current.close());
    await waitFor(() => expect(result.current.selected).toBeNull());
  });
});

function setup(
  overrides: { retrieve?: () => Promise<AssetDetails | null> },
  initialState?: string,
  sync?: () => Promise<boolean>,
  store = makeRecentStore()
) {
  const services = makeServices({
    assets: {
      search: () => Promise.resolve([]),
      retrieve: overrides.retrieve ?? (() => Promise.resolve({ asset: PUMP, ancestors: [] })),
    },
  });
  return renderHook(() => useAssetViewModel(), { wrapper: makeWrapper(services, initialState, sync, undefined, store) });
}
