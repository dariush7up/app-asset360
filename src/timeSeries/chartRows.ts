import type { ChartSeries } from './TimeSeriesService';

/** One chart row: a timestamp plus one value per series under the keys `s0`, `s1`, ... */
export type ChartRow = { timestamp: number } & Record<string, number>;

export function seriesKey(index: number): string {
  return `s${index}`;
}

/** Merges per-series points into rows by timestamp, so one line chart can draw several series. */
export function toChartRows(series: ChartSeries[]): ChartRow[] {
  const rows = new Map<number, ChartRow>();
  series.forEach((entry, index) => {
    for (const point of entry.points) {
      const row = rows.get(point.timestamp) ?? { timestamp: point.timestamp };
      row[seriesKey(index)] = point.value;
      rows.set(point.timestamp, row);
    }
  });
  return [...rows.values()].sort((a, b) => a.timestamp - b.timestamp);
}
