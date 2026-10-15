import type { DatapointAggregates, Datapoints, QueryResponse } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { makeNode } from '../__mocks__/instances';
import { CDM_VIEWS } from '../cdm/views';

import {
  ApiTimeSeriesService,
  granularityForSpan,
  rangeGranularity,
  rangeStart,
  type TimeSeriesClient,
} from './TimeSeriesService';

const ASSET = { space: 'sp', externalId: 'pump-101' };
const TEMP = { space: 'sp', externalId: 'temp' };
const PRESSURE = { space: 'sp', externalId: 'pressure' };
const HOUR = 3_600_000;

describe('time range helpers', () => {
  it('computes the start of each range from its end, and its granularity', () => {
    expect(rangeStart('1h', 10_000_000)).toBe(6_400_000);
    expect(rangeGranularity('30d')).toBe('6h');
  });

  it('picks the finest granularity that keeps the whole history to about 500 points', () => {
    expect(granularityForSpan(HOUR)).toBe('1m');
    expect(granularityForSpan(30 * 24 * HOUR)).toBe('6h');
    expect(granularityForSpan(365 * 24 * HOUR)).toBe('1d');
    expect(granularityForSpan(20 * 365 * 24 * HOUR)).toBe('7d');
  });
});

describe(ApiTimeSeriesService.name + ' listForAsset', () => {
  it('queries the time series view for series linked to the asset', async () => {
    const query = vi.fn<TimeSeriesClient['instances']['query']>(() =>
      Promise.resolve(
        queryResult('timeSeries', [
          makeNode(TEMP, CDM_VIEWS.timeSeries, { name: 'Temp', type: 'numeric', sourceUnit: 'degC' }),
          makeNode({ space: 'sp', externalId: 'valve' }, CDM_VIEWS.timeSeries, { type: 'state' }),
          makeNode({ space: 'sp', externalId: 'untyped' }, CDM_VIEWS.timeSeries, {}),
        ])
      )
    );
    const service = new ApiTimeSeriesService(makeClient({ query }));

    const result = await service.listForAsset(ASSET);

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        with: expect.objectContaining({
          timeSeries: expect.objectContaining({
            nodes: expect.objectContaining({
              filter: expect.objectContaining({
                and: expect.arrayContaining([expect.objectContaining({ hasData: expect.anything() })]),
              }),
            }),
          }),
        }),
      })
    );
    expect(result.items.map((s) => [s.name, s.plottable, s.type])).toEqual([
      ['Temp', true, 'numeric'],
      ['valve', false, 'state'],
      ['untyped', true, undefined],
    ]);
    expect(result.items[0].sourceUnit).toBe('degC');
  });

  it('flags a truncated list', async () => {
    const query = vi.fn<TimeSeriesClient['instances']['query']>(() =>
      Promise.resolve(queryResult('timeSeries', [makeNode(TEMP, CDM_VIEWS.timeSeries, { name: 'Temp' })], 'more'))
    );
    const service = new ApiTimeSeriesService(makeClient({ query }));

    expect((await service.listForAsset(ASSET)).truncated).toBe(true);
  });
});

describe(ApiTimeSeriesService.name + ' loadChart', () => {
  it('returns an empty chart without calling CDF when no series is chosen', async () => {
    const retrieveLatest = vi.fn<TimeSeriesClient['datapoints']['retrieveLatest']>();
    const service = new ApiTimeSeriesService(makeClient({}, { retrieveLatest }));

    expect(await service.loadChart([], '24h')).toEqual({ series: [] });
    expect(retrieveLatest).not.toHaveBeenCalled();
  });

  it('ends the window at the latest datapoint among the chosen series, not at the current time', async () => {
    const retrieveLatest = vi.fn<TimeSeriesClient['datapoints']['retrieveLatest']>(() =>
      Promise.resolve([latest(TEMP, 5 * HOUR), latest(PRESSURE, 9 * HOUR)])
    );
    const retrieve = vi.fn<TimeSeriesClient['datapoints']['retrieve']>(() =>
      Promise.resolve([aggregates(TEMP, [[9 * HOUR - 1000, 1]]), aggregates(PRESSURE, [[9 * HOUR, 2]])])
    );
    const service = new ApiTimeSeriesService(makeClient({}, { retrieve, retrieveLatest }));

    const chart = await service.loadChart([TEMP, PRESSURE], '1h');

    expect(chart.end).toBe(9 * HOUR);
    expect(chart.start).toBe(8 * HOUR);
    expect(retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ instanceId: TEMP }, { instanceId: PRESSURE }],
        start: 8 * HOUR,
        end: 9 * HOUR + 1,
        aggregates: ['average'],
        granularity: '1m',
      })
    );
    expect(chart.series.map((s) => [s.ref.externalId, s.hasData, s.points.length])).toEqual([
      ['temp', true, 1],
      ['pressure', true, 1],
    ]);
  });

  it('marks a series with no datapoints at all as empty and leaves it out of the data request', async () => {
    const retrieveLatest = vi.fn<TimeSeriesClient['datapoints']['retrieveLatest']>(() =>
      Promise.resolve([latest(TEMP, 5 * HOUR), latest(PRESSURE, undefined)])
    );
    const retrieve = vi.fn<TimeSeriesClient['datapoints']['retrieve']>(() =>
      Promise.resolve([aggregates(TEMP, [[5 * HOUR, 1]])])
    );
    const service = new ApiTimeSeriesService(makeClient({}, { retrieve, retrieveLatest }));

    const chart = await service.loadChart([TEMP, PRESSURE], '24h');

    expect(retrieve).toHaveBeenCalledWith(expect.objectContaining({ items: [{ instanceId: TEMP }] }));
    expect(chart.series.map((s) => [s.ref.externalId, s.hasData])).toEqual([
      ['temp', true],
      ['pressure', false],
    ]);
  });

  it('returns empty series and fetches no datapoints when none of the series has data', async () => {
    const retrieveLatest = vi.fn<TimeSeriesClient['datapoints']['retrieveLatest']>(() =>
      Promise.resolve([latest(TEMP, undefined)])
    );
    const retrieve = vi.fn<TimeSeriesClient['datapoints']['retrieve']>();
    const service = new ApiTimeSeriesService(makeClient({}, { retrieve, retrieveLatest }));

    const chart = await service.loadChart([TEMP], '24h');

    expect(chart).toEqual({ series: [{ ref: TEMP, points: [], hasData: false }] });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it('covers the whole history up to the latest datapoint for the all range', async () => {
    const end = 400 * 24 * HOUR;
    const retrieveLatest = vi.fn<TimeSeriesClient['datapoints']['retrieveLatest']>(() => Promise.resolve([latest(TEMP, end)]));
    const retrieve = vi
      .fn<TimeSeriesClient['datapoints']['retrieve']>()
      .mockResolvedValueOnce([{ id: 1, isString: false, isStep: false, instanceId: TEMP, datapoints: [{ timestamp: new Date(1000), value: 1 }] }])
      .mockResolvedValueOnce([aggregates(TEMP, [[1000, 2]])]);
    const service = new ApiTimeSeriesService(makeClient({}, { retrieve, retrieveLatest }));

    const chart = await service.loadChart([TEMP], 'all');

    expect(retrieve).toHaveBeenNthCalledWith(1, expect.objectContaining({ start: 0, limit: 1 }));
    expect(retrieve).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ start: 1000, end: end + 1, granularity: '1d' })
    );
    expect(chart.series[0].points).toEqual([{ timestamp: 1000, value: 2 }]);
  });

  it('propagates API errors', async () => {
    const retrieveLatest = vi.fn<TimeSeriesClient['datapoints']['retrieveLatest']>(() => Promise.reject(new Error('403')));
    const service = new ApiTimeSeriesService(makeClient({}, { retrieveLatest }));

    await expect(service.loadChart([TEMP], '1h')).rejects.toThrow('403');
  });
});

function makeClient(
  instances: Partial<TimeSeriesClient['instances']> = {},
  datapoints: Partial<TimeSeriesClient['datapoints']> = {}
): TimeSeriesClient {
  const fail = () => Promise.reject(new Error('unexpected call'));
  return {
    instances: { query: fail, ...instances },
    datapoints: { retrieve: fail, retrieveLatest: fail, ...datapoints },
  };
}

function queryResult(resultSet: string, items: unknown[], nextCursor?: string): QueryResponse {
  return {
    items: { [resultSet]: items },
    nextCursor: nextCursor ? { [resultSet]: nextCursor } : {},
  } as QueryResponse;
}

function latest(ref: { space: string; externalId: string }, timestamp: number | undefined): Datapoints {
  return {
    id: 1,
    isString: false,
    isStep: false,
    instanceId: ref,
    datapoints: timestamp === undefined ? [] : [{ timestamp: new Date(timestamp), value: 1 }],
  };
}

function aggregates(ref: { space: string; externalId: string }, points: [number, number][]): DatapointAggregates {
  return {
    id: 1,
    isString: false,
    isStep: false,
    instanceId: ref,
    datapoints: points.map(([timestamp, average]) => ({ timestamp: new Date(timestamp), average })),
  };
}
