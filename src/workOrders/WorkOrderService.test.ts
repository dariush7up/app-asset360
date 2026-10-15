import type { PropertyValueGroupV3, QueryResponse } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { makeNode } from '../__mocks__/instances';
import { CDM_VIEWS } from '../cdm/views';

import { ApiWorkOrderService, type WorkOrderClient } from './WorkOrderService';

const ASSET = { space: 'sp', externalId: 'pump-101' };
const RESULT = 'workOrders';

describe(ApiWorkOrderService.name, () => {
  it('queries the maintenance order view for orders linked to the asset by assets or main asset', async () => {
    const query = vi.fn<WorkOrderClient['instances']['query']>(() => Promise.resolve(queryResult([])));
    const service = new ApiWorkOrderService({ instances: { query } });

    await service.listForAsset(ASSET);

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        with: expect.objectContaining({
          [RESULT]: expect.objectContaining({
            nodes: expect.objectContaining({
              filter: {
                and: [
                  { hasData: [CDM_VIEWS.maintenanceOrder] },
                  {
                    or: [
                      { containsAny: { property: ['cdf_idm', 'CogniteMaintenanceOrder/v1', 'assets'], values: [ASSET] } },
                      { equals: { property: ['cdf_idm', 'CogniteMaintenanceOrder/v1', 'mainAsset'], value: ASSET } },
                    ],
                  },
                ],
              },
            }),
          }),
        }),
        select: expect.objectContaining({
          [RESULT]: { sources: [{ source: CDM_VIEWS.maintenanceOrder, properties: [] }] },
        }),
      })
    );
  });

  it('shows identifier, title, status, priority, type and a date, most recent first', async () => {
    const query = vi.fn<WorkOrderClient['instances']['query']>(() =>
      Promise.resolve(
        queryResult([
          order('old', { name: 'Old job', sourceId: 'FAO-1', status: 'Done', startTime: '2019-05-29T09:00:00Z' }),
          order('new', {
            name: 'New job',
            sourceId: 'FAO-2',
            status: 'Open',
            priority: 2,
            type: 'PM01',
            startTime: '2024-03-01T00:00:00Z',
          }),
          order('undated', { name: 'Undated' }),
        ])
      )
    );
    const service = new ApiWorkOrderService({ instances: { query } });

    const result = await service.listForAsset(ASSET);

    expect(result.items.map((w) => w.identifier)).toEqual(['FAO-2', 'FAO-1', 'undated']);
    expect(result.items[0]).toMatchObject({
      title: 'New job',
      status: 'Open',
      priority: '2',
      type: 'PM01',
      date: Date.UTC(2024, 2, 1),
    });
  });

  it('falls back to the scheduled start, then the source creation time, for the date', async () => {
    const query = vi.fn<WorkOrderClient['instances']['query']>(() =>
      Promise.resolve(
        queryResult([
          order('scheduled', { scheduledStartTime: '2024-05-01T00:00:00Z' }),
          order('created', { sourceCreatedTime: '2024-01-01T00:00:00Z' }),
        ])
      )
    );
    const service = new ApiWorkOrderService({ instances: { query } });

    const result = await service.listForAsset(ASSET);

    expect(result.items.map((w) => [w.identifier, w.date])).toEqual([
      ['scheduled', Date.UTC(2024, 4, 1)],
      ['created', Date.UTC(2024, 0, 1)],
    ]);
  });

  it('follows cursors and flags a truncated list', async () => {
    const query = vi.fn<WorkOrderClient['instances']['query']>(() =>
      Promise.resolve(queryResult([order('o', {})], 'more'))
    );
    const service = new ApiWorkOrderService({ instances: { query } });

    const result = await service.listForAsset(ASSET);

    expect(query).toHaveBeenNthCalledWith(2, expect.objectContaining({ cursors: { [RESULT]: 'more' } }));
    expect(result.truncated).toBe(true);
  });

  it('propagates API errors', async () => {
    const query = vi.fn<WorkOrderClient['instances']['query']>(() => Promise.reject(new Error('403')));
    const service = new ApiWorkOrderService({ instances: { query } });

    await expect(service.listForAsset(ASSET)).rejects.toThrow('403');
  });
});

function order(externalId: string, properties: PropertyValueGroupV3) {
  return makeNode({ space: 'sp', externalId }, CDM_VIEWS.maintenanceOrder, properties);
}

function queryResult(items: unknown[], nextCursor?: string): QueryResponse {
  return {
    items: { [RESULT]: items },
    nextCursor: nextCursor ? { [RESULT]: nextCursor } : {},
  } as QueryResponse;
}
