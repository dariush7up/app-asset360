import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { listing, makeServices, makeWrapper } from '../__mocks__/renderWithApp';
import type { Listing } from '../cdm/paging';

import { useWorkOrdersViewModel } from './useWorkOrdersViewModel';
import type { WorkOrder } from './WorkOrderService';

const ASSET = { space: 'sp', externalId: 'pump' };
const FIRST: WorkOrder = { ref: { space: 'sp', externalId: 'a' }, identifier: 'FAO-1', title: 'Replace seal' };
const SECOND: WorkOrder = { ref: { space: 'sp', externalId: 'b' }, identifier: 'FAO-2', title: 'Inspect' };

describe(useWorkOrdersViewModel.name, () => {
  it('starts loading, then lists the work orders', async () => {
    const { result } = setup(() => Promise.resolve(listing([FIRST, SECOND])));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.workOrders).toEqual([FIRST, SECOND]));
    expect(result.current.selected).toBeNull();
  });

  it('reports truncation', async () => {
    const { result } = setup(() => Promise.resolve(listing([FIRST], true)));

    await waitFor(() => expect(result.current.truncated).toBe(true));
  });

  it('exposes the error and retries on request', async () => {
    const list = vi
      .fn<() => Promise<Listing<WorkOrder>>>()
      .mockRejectedValueOnce(Object.assign(new Error('403 forbidden'), { status: 403 }))
      .mockResolvedValueOnce(listing([FIRST]));
    const { result } = setup(list);

    await waitFor(() => expect(result.current.error?.message).toBe('403 forbidden'));
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.workOrders).toEqual([FIRST]));
  });

  it('restores the selected work order from the host state', async () => {
    const { result } = setup(() => Promise.resolve(listing([FIRST, SECOND])), JSON.stringify({ workOrderId: SECOND.ref }));

    await waitFor(() => expect(result.current.selected).toEqual(SECOND));
  });

  it('syncs selecting and closing a work order to the host', async () => {
    const sync = vi.fn(() => Promise.resolve(true));
    const { result } = setup(() => Promise.resolve(listing([FIRST])), undefined, sync);
    await waitFor(() => expect(result.current.workOrders).toHaveLength(1));

    act(() => result.current.select(FIRST.ref));
    await waitFor(() => expect(result.current.selected).toEqual(FIRST));
    act(() => result.current.clearSelection());
    await waitFor(() => expect(result.current.selected).toBeNull());

    expect(sync).toHaveBeenCalledWith(expect.stringContaining('"externalId":"a"'));
  });
});

function setup(listForAsset: () => Promise<Listing<WorkOrder>>, initialState?: string, sync?: () => Promise<boolean>) {
  const services = makeServices({ workOrders: { listForAsset } });
  return renderHook(() => useWorkOrdersViewModel(ASSET), { wrapper: makeWrapper(services, initialState, sync) });
}
