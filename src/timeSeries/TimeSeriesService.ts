import type { CogniteClient } from '@cognite/sdk';

import { linkedToAssetFilter } from '../cdm/linkedFilter';
import { PAGE_SIZE, queryPages, type Listing } from '../cdm/paging';
import { asString, readProperties } from '../cdm/properties';
import { allPropertiesFrom, CDM_VIEWS, instanceKey, type InstanceRef } from '../cdm/views';

export type TimeSeriesInfo = {
  ref: InstanceRef;
  name: string;
  description?: string;
  sourceUnit?: string;
  /** Only numeric series can be drawn as a line. */
  plottable: boolean;
  /** `numeric`, `string` or `state`; empty when the series does not say. */
  type?: string;
};
export type DataPoint = { timestamp: number; value: number };

/** `all` covers the whole history of the chosen series, from the first datapoint to the latest. */
export const TIME_RANGES = ['1h', '24h', '7d', '30d', 'all'] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

export type ChartSeries = { ref: InstanceRef; points: DataPoint[]; hasData: boolean };
export type ChartData = {
  /** Latest datapoint among the chosen series; the window ends here, not at the current time. */
  end?: number;
  start?: number;
  series: ChartSeries[];
};

export interface TimeSeriesService {
  /** Every series linked to the asset. */
  listForAsset(asset: InstanceRef): Promise<Listing<TimeSeriesInfo>>;
  /** Datapoints for the chosen series, in a window that ends at the latest datapoint among them. */
  loadChart(series: InstanceRef[], range: TimeRange): Promise<ChartData>;
}

/** Narrow slice of CogniteClient that this service depends on. */
export interface TimeSeriesClient {
  instances: Pick<CogniteClient['instances'], 'query'>;
  datapoints: Pick<CogniteClient['datapoints'], 'retrieve' | 'retrieveLatest'>;
}

type FixedRange = Exclude<TimeRange, 'all'>;

const RANGE_MS: Record<FixedRange, number> = {
  '1h': 3_600_000,
  '24h': 86_400_000,
  '7d': 7 * 86_400_000,
  '30d': 30 * 86_400_000,
};
/** Aggregation granularity per fixed range, keeping each chart to roughly 60-170 points. */
const RANGE_GRANULARITY: Record<FixedRange, string> = { '1h': '1m', '24h': '15m', '7d': '1h', '30d': '6h' };
/** Granularities to pick from for `all`, finest first, as [label, milliseconds]. */
const ALL_GRANULARITIES: [string, number][] = [
  ['1m', 60_000],
  ['5m', 5 * 60_000],
  ['15m', 15 * 60_000],
  ['1h', 3_600_000],
  ['6h', 6 * 3_600_000],
  ['1d', 86_400_000],
  ['7d', 7 * 86_400_000],
];
const TARGET_POINTS = 500;
const MAX_POINTS = 1000;

export function isFixedRange(range: TimeRange): range is FixedRange {
  return range !== 'all';
}

export function rangeStart(range: FixedRange, end: number): number {
  return end - RANGE_MS[range];
}

export function rangeGranularity(range: FixedRange): string {
  return RANGE_GRANULARITY[range];
}

/** Finest granularity that keeps a span of `spanMs` to about 500 points (coarsest if none fits). */
export function granularityForSpan(spanMs: number): string {
  const fit = ALL_GRANULARITIES.find(([, ms]) => spanMs / ms <= TARGET_POINTS);
  return (fit ?? ALL_GRANULARITIES[ALL_GRANULARITIES.length - 1])[0];
}

export class ApiTimeSeriesService implements TimeSeriesService {
  constructor(private readonly client: TimeSeriesClient) {}

  async listForAsset(asset: InstanceRef): Promise<Listing<TimeSeriesInfo>> {
    const VIEW = CDM_VIEWS.timeSeries;
    const RESULT = 'timeSeries';
    const { items, truncated } = await queryPages(RESULT, (cursors) =>
      this.client.instances.query({
        with: {
          [RESULT]: {
            nodes: { filter: linkedToAssetFilter(VIEW, asset) },
            limit: PAGE_SIZE,
          },
        },
        select: { [RESULT]: { sources: allPropertiesFrom(VIEW) } },
        cursors,
      })
    );
    const series = items.map((node) => {
      const props = readProperties(node, VIEW);
      const type = asString(props.type);
      return {
        ref: { space: node.space, externalId: node.externalId },
        name: asString(props.name) ?? node.externalId,
        description: asString(props.description),
        sourceUnit: asString(props.sourceUnit),
        type,
        plottable: type === undefined || type === 'numeric',
      };
    });
    return { items: series, truncated };
  }

  async loadChart(series: InstanceRef[], range: TimeRange): Promise<ChartData> {
    if (series.length === 0) return { series: [] };

    const latest = await this.latestTimestamps(series);
    const withData = series.filter((ref) => latest.has(instanceKey(ref)));
    const end = withData.length > 0 ? Math.max(...withData.map((ref) => latest.get(instanceKey(ref)) ?? 0)) : undefined;
    if (end === undefined) return { series: series.map((ref) => ({ ref, points: [], hasData: false })) };

    const start = isFixedRange(range) ? rangeStart(range, end) : await this.earliestTimestamp(withData);
    const granularity = isFixedRange(range) ? rangeGranularity(range) : granularityForSpan(Math.max(end - start, 1));

    const results = await this.client.datapoints.retrieve({
      items: withData.map((ref) => ({ instanceId: ref })),
      start,
      end: end + 1,
      aggregates: ['average'],
      granularity,
      limit: MAX_POINTS,
    });

    const pointsByKey = new Map<string, DataPoint[]>();
    for (const result of results) {
      if (!result.instanceId) continue;
      const points: DataPoint[] = [];
      for (const point of result.datapoints) {
        const value = 'average' in point ? point.average : 'value' in point ? point.value : undefined;
        if (typeof value === 'number') points.push({ timestamp: point.timestamp.getTime(), value });
      }
      pointsByKey.set(instanceKey(result.instanceId), points);
    }

    return {
      end,
      start,
      series: series.map((ref) => {
        const points = pointsByKey.get(instanceKey(ref)) ?? [];
        return { ref, points, hasData: points.length > 0 };
      }),
    };
  }

  /** Timestamp of the most recent datapoint per series; series without datapoints are left out. */
  private async latestTimestamps(series: InstanceRef[]): Promise<Map<string, number>> {
    const results = await this.client.datapoints.retrieveLatest(
      series.map((ref) => ({ instanceId: ref })),
      { ignoreUnknownIds: true }
    );
    const latest = new Map<string, number>();
    for (const result of results) {
      const timestamp = result.datapoints[0]?.timestamp.getTime();
      if (result.instanceId && Number.isFinite(timestamp)) latest.set(instanceKey(result.instanceId), timestamp);
    }
    return latest;
  }

  /** Timestamp of the first datapoint among the series. */
  private async earliestTimestamp(series: InstanceRef[]): Promise<number> {
    const results = await this.client.datapoints.retrieve({
      items: series.map((ref) => ({ instanceId: ref })),
      start: 0,
      limit: 1,
    });
    const firsts = results.flatMap((result) => {
      const timestamp = result.datapoints[0]?.timestamp.getTime();
      return timestamp === undefined ? [] : [timestamp];
    });
    return firsts.length > 0 ? Math.min(...firsts) : 0;
  }
}
