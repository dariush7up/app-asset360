import { asInstanceRef, asInstanceRefList } from '../cdm/properties';
import type { InstanceRef } from '../cdm/views';
import { TIME_RANGES, type TimeRange } from '../timeSeries/TimeSeriesService';

/** UI state that survives a reload and is restored from a shared link (synced through the Fusion host). */
export type AppState = {
  /** Submitted search text. */
  query: string;
  asset?: InstanceRef;
  /** Time series the analyst chose to plot. Nothing is plotted until at least one is chosen. */
  seriesIds: InstanceRef[];
  range: TimeRange;
  workOrderId?: InstanceRef;
  fileId?: InstanceRef;
};

export const DEFAULT_APP_STATE: AppState = { query: '', seriesIds: [], range: '24h' };

function isTimeRange(value: unknown): value is TimeRange {
  return TIME_RANGES.some((range) => range === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Parses the host-provided state string, falling back to defaults for anything missing or malformed. */
export function parseAppState(raw: string | undefined): AppState {
  if (!raw) return DEFAULT_APP_STATE;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_APP_STATE;
  }
  if (!isRecord(parsed)) return DEFAULT_APP_STATE;
  return {
    query: typeof parsed.query === 'string' ? parsed.query : DEFAULT_APP_STATE.query,
    asset: asInstanceRef(parsed.asset),
    seriesIds: asInstanceRefList(parsed.seriesIds),
    range: isTimeRange(parsed.range) ? parsed.range : DEFAULT_APP_STATE.range,
    workOrderId: asInstanceRef(parsed.workOrderId),
    fileId: asInstanceRef(parsed.fileId),
  };
}
