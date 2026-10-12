import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { instanceKey, type InstanceRef } from '../cdm/views';
import { queryState, type PanelState } from '../lib/queryState';
import { useAppServices } from '../services/AppServices';
import { useAppState } from '../state/appStateContext';

import { toChartRows, type ChartRow } from './chartRows';
import type { ChartData, TimeRange, TimeSeriesInfo } from './TimeSeriesService';

export type TimeSeriesViewModel = PanelState & {
  /** Every series linked to the asset. */
  series: TimeSeriesInfo[];
  truncated: boolean;
  /** The series the analyst chose to plot, in the order they were chosen. */
  selected: TimeSeriesInfo[];
  range: TimeRange;
  chart: ChartData | undefined;
  rows: ChartRow[];
  chartLoading: boolean;
  /** True while a manual refresh is re-fetching data that is already on screen. */
  refreshing: boolean;
  chartError: Error | null;
  /** Adds the series to the chart, or removes it when it is already plotted. */
  toggleSeries: (ref: InstanceRef) => void;
  setRange: (range: TimeRange) => void;
  /** Re-fetches the chart data. The chart never refreshes on its own. */
  refresh: () => void;
};

export function useTimeSeriesViewModel(asset: InstanceRef): TimeSeriesViewModel {
  const { timeSeries } = useAppServices();
  const { state, update } = useAppState();

  const listQuery = useQuery({
    queryKey: ['timeSeries', instanceKey(asset)],
    queryFn: () => timeSeries.listForAsset(asset),
  });
  const series = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  const selected = useMemo(
    () =>
      state.seriesIds.flatMap((id) => {
        const match = series.find((s) => s.plottable && instanceKey(s.ref) === instanceKey(id));
        return match ? [match] : [];
      }),
    [series, state.seriesIds]
  );

  const chartQuery = useQuery({
    queryKey: ['timeSeries', 'chart', selected.map((s) => instanceKey(s.ref)), state.range],
    queryFn: () => timeSeries.loadChart(selected.map((s) => s.ref), state.range),
    enabled: selected.length > 0,
    // Data refreshes only when the analyst asks: no polling, no refetch on focus or reconnect.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const rows = useMemo(() => toChartRows(chartQuery.data?.series ?? []), [chartQuery.data]);

  return {
    ...queryState(listQuery),
    series,
    truncated: listQuery.data?.truncated ?? false,
    selected,
    range: state.range,
    chart: chartQuery.data,
    rows,
    chartLoading: selected.length > 0 && chartQuery.isLoading,
    refreshing: chartQuery.isFetching && !chartQuery.isLoading,
    chartError: chartQuery.error,
    toggleSeries: (ref) => {
      const key = instanceKey(ref);
      const chosen = state.seriesIds.some((id) => instanceKey(id) === key);
      update({ seriesIds: chosen ? state.seriesIds.filter((id) => instanceKey(id) !== key) : [...state.seriesIds, ref] });
    },
    setRange: (range) => update({ range }),
    refresh: () => void chartQuery.refetch(),
  };
}
