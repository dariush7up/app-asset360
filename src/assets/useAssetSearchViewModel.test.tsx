import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeServices, makeWrapper } from '../__mocks__/renderWithApp';

import type { Asset } from './AssetService';
import { useAssetSearchViewModel } from './useAssetSearchViewModel';

const PUMP: Asset = { ref: { space: 'sp', externalId: 'pump' }, tag: 'pump', name: 'PUMP-101', aliases: [], path: [] };

describe(useAssetSearchViewModel.name, () => {
  it('does not search or load while the query is empty', () => {
    const search = vi.fn(() => Promise.resolve([PUMP]));
    const { result } = setup(search);

    expect(result.current).toMatchObject({ query: '', results: [], isLoading: false, error: null });
    expect(search).not.toHaveBeenCalled();
  });

  it('loads, then returns results for the restored query', async () => {
    const { result } = setup(() => Promise.resolve([PUMP]), JSON.stringify({ query: 'pump' }));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.results).toEqual([PUMP]));
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes the error message when the search fails', async () => {
    const { result } = setup(() => Promise.reject(new Error('403 forbidden')), JSON.stringify({ query: 'pump' }));

    await waitFor(() => expect(result.current.error?.message).toBe('403 forbidden'));
  });

  it('syncs the submitted query and the selected asset to the host', async () => {
    const sync = vi.fn(() => Promise.resolve(true));
    const { result } = setup(() => Promise.resolve([PUMP]), undefined, sync);

    act(() => result.current.search('pump'));
    act(() => result.current.select(PUMP.ref));

    await waitFor(() => expect(sync).toHaveBeenLastCalledWith(expect.stringContaining('"externalId":"pump"')));
    expect(sync).toHaveBeenCalledWith(expect.stringContaining('"query":"pump"'));
  });
});

function setup(search: () => Promise<Asset[]>, initialState?: string, sync?: () => Promise<boolean>) {
  const services = makeServices({
    assets: { search, retrieve: () => Promise.resolve(null) },
  });
  return renderHook(() => useAssetSearchViewModel(), { wrapper: makeWrapper(services, initialState, sync) });
}
