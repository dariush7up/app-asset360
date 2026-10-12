import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { listing, makeServices, makeWrapper } from '../__mocks__/renderWithApp';
import type { Listing } from '../cdm/paging';

import type { ChartData, TimeSeriesInfo } from './TimeSeriesService';
import { useTimeSeriesViewModel } from './useTimeSeriesViewModel';

const ASSET = { space: 'sp', externalId: 'pump' };
const TEMP: TimeSeriesInfo = { ref: { space: 'sp', externalId: 'temp' }, name: 'Temperature', plottable: true };
const PRESSURE: TimeSeriesInfo = { ref: { space: 'sp', externalId: 'pressure' }, name: 'Pressure', plottable: true };
const VALVE: TimeSeriesInfo = { ref: { space: 'sp', externalId: 'valve' }, name: 'Valve', plottable: false, type: 'state' };

describe(useTimeSeriesViewModel.name, () => {
  it('lists every linked series but plots none until the analyst chooses', async () => {
    const loadChart = vi.fn();
    const { result } = setup({ loadChart });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.series).toHaveLength(3));
    expect(result.current.selected).toEqual([]);
    expect(result.current.chartLoading).toBe(false);
    expect(loadChart).not.toHaveBeenCalled();
  });

  it('loads the chart for the series restored from the host state, in the chosen order', async () => {
    const loadChart = vi.fn(() => Promise.resolve(chart([PRESSURE, TEMP])));
    const { result } = setup({ loadChart }, JSON.stringify({ seriesIds: [PRESSURE.ref, TEMP.ref], range: '7d' }));

    await waitFor(() => expect(result.current.selected.map((s) => s.name)).toEqual(['Pressure', 'Temperature']));
    await waitFor(() => expect(result.current.rows.length).toBeGreaterThan(0));
    expect(loadChart).toHaveBeenCalledWith([PRESSURE.ref, TEMP.ref], '7d');
  });

  it('ignores chosen series that cannot be plotted or no longer exist', async () => {
    const { result } = setup({}, JSON.stringify({ seriesIds: [VALVE.ref, { space: 'sp', externalId: 'gone' }] }));

    await waitFor(() => expect(result.current.series).toHaveLength(3));
    expect(result.current.selected).toEqual([]);
  });

  it('adds and removes series from the chart and syncs the choice to the host', async () => {
    const sync = vi.fn(() => Promise.resolve(true));
    const { result } = setup({}, undefined, sync);
    await waitFor(() => expect(result.current.series).toHaveLength(3));

    act(() => result.current.toggleSeries(TEMP.ref));
    await waitFor(() => expect(result.current.selected).toHaveLength(1));
    act(() => result.current.toggleSeries(PRESSURE.ref));
    await waitFor(() => expect(result.current.selected).toHaveLength(2));
    act(() => result.current.toggleSeries(TEMP.ref));
    await waitFor(() => expect(result.current.selected.map((s) => s.name)).toEqual(['Pressure']));

    expect(sync).toHaveBeenLastCalledWith(expect.stringContaining('"externalId":"pressure"'));
  });

  it('refreshes only when asked: never on its own', async () => {
    const loadChart = vi.fn(() => Promise.resolve(chart([TEMP])));
    const { result } = setup({ loadChart }, JSON.stringify({ seriesIds: [TEMP.ref] }));
    await waitFor(() => expect(result.current.chart).toBeDefined());
    expect(loadChart).toHaveBeenCalledTimes(1);

    act(() => result.current.refresh());

    await waitFor(() => expect(loadChart).toHaveBeenCalledTimes(2));
  });

  it('changes the time range and syncs it to the host', async () => {
    const sync = vi.fn(() => Promise.resolve(true));
    const { result } = setup({}, undefined, sync);

    act(() => result.current.setRange('30d'));

    await waitFor(() => expect(result.current.range).toBe('30d'));
    expect(sync).toHaveBeenLastCalledWith(expect.stringContaining('"range":"30d"'));
  });

  it('reports truncation of the series list', async () => {
    const { result } = setup({ list: () => Promise.resolve(listing([TEMP], true)) });

    await waitFor(() => expect(result.current.truncated).toBe(true));
  });

  it('exposes list errors and chart errors separately', async () => {
    const failedList = setup({ list: () => Promise.reject(new Error('list failed')) });
    await waitFor(() => expect(failedList.result.current.error?.message).toBe('list failed'));

    const failedChart = setup(
      { loadChart: () => Promise.reject(new Error('chart failed')) },
      JSON.stringify({ seriesIds: [TEMP.ref] })
    );
    await waitFor(() => expect(failedChart.result.current.chartError?.message).toBe('chart failed'));
  });
});

type Overrides = {
  list?: () => Promise<Listing<TimeSeriesInfo>>;
  loadChart?: (series: { space: string; externalId: string }[], range: string) => Promise<ChartData>;
};

function setup(overrides: Overrides, initialState?: string, sync?: () => Promise<boolean>) {
  const services = makeServices({
    timeSeries: {
      listForAsset: overrides.list ?? (() => Promise.resolve(listing([TEMP, PRESSURE, VALVE]))),
      loadChart: overrides.loadChart ?? ((series) => Promise.resolve(chart(series.map((ref) => [TEMP, PRESSURE].find((s) => s.ref.externalId === ref.externalId) ?? TEMP)))),
    },
  });
  return renderHook(() => useTimeSeriesViewModel(ASSET), { wrapper: makeWrapper(services, initialState, sync) });
}

function chart(series: TimeSeriesInfo[]): ChartData {
  return {
    end: 1000,
    start: 0,
    series: series.map((s) => ({ ref: s.ref, hasData: true, points: [{ timestamp: 1000, value: 1 }] })),
  };
}
