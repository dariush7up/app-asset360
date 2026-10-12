import type { PropertyValueGroupV3 } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { makeNode as makeInstance } from '../__mocks__/instances';
import { CDM_VIEWS, type ViewRef } from '../cdm/views';

import { ApiAssetService, type AssetClient } from './AssetService';

const PUMP = { space: 'sp', externalId: 'pump-101' };
const AREA = { space: 'sp', externalId: 'area-1' };
const TYPE = { space: 'sp', externalId: 'centrifugal' };
const CLASS = { space: 'sp', externalId: 'pump-class' };

describe(ApiAssetService.name, () => {
  it('searches by name and description with the AND operator', async () => {
    const search = vi.fn<AssetClient['instances']['search']>(() =>
      Promise.resolve({ items: [asset(PUMP, { name: 'PUMP-101', description: 'Feed pump' })] })
    );
    const service = new ApiAssetService(makeClient({ search }));

    const result = await service.search('pump-1');

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'pump-1', properties: ['name', 'description'], operator: 'AND' })
    );
    expect(result).toEqual([expect.objectContaining({ ref: PUMP, tag: 'pump-101', name: 'PUMP-101', description: 'Feed pump' })]);
  });

  it('adds the parent asset name to each result for context', async () => {
    const search = vi.fn<AssetClient['instances']['search']>(() =>
      Promise.resolve({ items: [asset(PUMP, { name: 'PUMP-101', parent: AREA })] })
    );
    const retrieve = vi.fn<AssetClient['instances']['retrieve']>(() =>
      Promise.resolve({ items: [asset(AREA, { name: 'Area 1' })] })
    );
    const service = new ApiAssetService(makeClient({ search, retrieve }));

    const [result] = await service.search('pump');

    expect(result.parentName).toBe('Area 1');
    expect(retrieve).toHaveBeenCalledTimes(1);
  });

  it('does not look up parents when no result has one', async () => {
    const search = vi.fn<AssetClient['instances']['search']>(() => Promise.resolve({ items: [asset(PUMP, {})] }));
    const retrieve = vi.fn<AssetClient['instances']['retrieve']>();
    const service = new ApiAssetService(makeClient({ search, retrieve }));

    await service.search('pump');

    expect(retrieve).not.toHaveBeenCalled();
  });

  it('does not call the API for a blank query', async () => {
    const search = vi.fn<AssetClient['instances']['search']>();
    const service = new ApiAssetService(makeClient({ search }));

    expect(await service.search('   ')).toEqual([]);
    expect(search).not.toHaveBeenCalled();
  });

  it('falls back to the external id when an asset has no name', async () => {
    const search = vi.fn<AssetClient['instances']['search']>(() => Promise.resolve({ items: [asset(PUMP, {})] }));
    const service = new ApiAssetService(makeClient({ search }));

    const [result] = await service.search('x');

    expect(result.name).toBe('pump-101');
  });

  it('retrieves an asset with its ancestors, excluding itself, and the names of its type and class', async () => {
    const retrieve = vi.fn<AssetClient['instances']['retrieve']>(({ items, sources }) => {
      const isLabelLookup = sources?.some(
        ({ source }) => 'externalId' in source && source.externalId === 'CogniteAssetType'
      );
      if (isLabelLookup) {
        return Promise.resolve({
          items: [label(TYPE, CDM_VIEWS.assetType, 'Centrifugal pump'), label(CLASS, CDM_VIEWS.assetClass, 'Pump')],
        });
      }
      const wantsPump = items.some((item) => item.externalId === PUMP.externalId);
      return Promise.resolve({
        items: wantsPump
          ? [asset(PUMP, { name: 'PUMP-101', parent: AREA, path: [AREA, PUMP], type: TYPE, assetClass: CLASS })]
          : [asset(AREA, { name: 'Area 1' })],
      });
    });
    const service = new ApiAssetService(makeClient({ retrieve }));

    const result = await service.retrieve(PUMP);

    expect(result?.asset).toMatchObject({ tag: 'pump-101', typeName: 'Centrifugal pump', className: 'Pump' });
    expect(result?.ancestors.map((a) => a.name)).toEqual(['Area 1']);
  });

  it('returns the asset without type labels when it has no type or class', async () => {
    const retrieve = vi.fn<AssetClient['instances']['retrieve']>(() => Promise.resolve({ items: [asset(PUMP, { name: 'PUMP-101' })] }));
    const service = new ApiAssetService(makeClient({ retrieve }));

    const result = await service.retrieve(PUMP);

    expect(result?.asset.typeName).toBeUndefined();
    expect(retrieve).toHaveBeenCalledTimes(1);
  });

  it('returns null when the asset does not exist', async () => {
    const retrieve = vi.fn<AssetClient['instances']['retrieve']>(() => Promise.resolve({ items: [] }));
    const service = new ApiAssetService(makeClient({ retrieve }));

    expect(await service.retrieve(PUMP)).toBeNull();
  });

  it('propagates API errors', async () => {
    const search = vi.fn<AssetClient['instances']['search']>(() => Promise.reject(new Error('403')));
    const service = new ApiAssetService(makeClient({ search }));

    await expect(service.search('x')).rejects.toThrow('403');
  });
});

function makeClient(overrides: Partial<AssetClient['instances']>): AssetClient {
  const fail = () => Promise.reject(new Error('unexpected call'));
  return { instances: { search: fail, retrieve: fail, ...overrides } };
}

function asset(ref: { space: string; externalId: string }, properties: PropertyValueGroupV3) {
  return makeInstance(ref, CDM_VIEWS.asset, properties);
}

function label(ref: { space: string; externalId: string }, view: ViewRef, name: string) {
  return makeInstance(ref, view, { name });
}
