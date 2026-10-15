import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { EmptyState, EmptyStateTitle } from '@cognite/aura/components/empty-state';

import type { InstanceRef } from '../cdm/views';
import { instanceKey } from '../cdm/views';
import { formatDateTime } from '../lib/format';
import { TIME_RANGES } from '../timeSeries/TimeSeriesService';
import { useTimeSeriesViewModel } from '../timeSeries/useTimeSeriesViewModel';

import { Panel } from './Panel';
import { Section } from './Section';
import { TimeSeriesChart } from './TimeSeriesChart';

export function TimeSeriesPanel({ asset }: { asset: InstanceRef }) {
  const vm = useTimeSeriesViewModel(asset);
  const plotted = vm.chart?.series.flatMap((s, i) => (s.hasData ? [{ info: vm.selected[i], index: i }] : [])) ?? [];
  const withoutData = vm.chart?.series.flatMap((s, i) => (s.hasData ? [] : [vm.selected[i]])) ?? [];

  return (
    <Panel title="Time series">
      <Section
        label="Time series"
        isLoading={vm.isLoading}
        error={vm.error}
        onRetry={vm.retry}
        isEmpty={vm.series.length === 0}
        emptyText="No time series are linked to this asset."
        truncated={vm.truncated}
      >
        <div className="flex flex-col gap-4">
          <CheckboxGroup aria-label="Time series to plot" className="max-h-44 overflow-y-auto">
            {vm.series.map((s) => (
              <CheckboxItem key={instanceKey(s.ref)}>
                <CheckboxItemControl
                  checked={vm.selected.some((chosen) => instanceKey(chosen.ref) === instanceKey(s.ref))}
                  disabled={!s.plottable}
                  onCheckedChange={() => vm.toggleSeries(s.ref)}
                />
                <CheckboxItemLabel>{s.name}</CheckboxItemLabel>
                {s.plottable ? null : <Badge variant="mountain">{s.type} (cannot be plotted)</Badge>}
              </CheckboxItem>
            ))}
          </CheckboxGroup>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2" role="group" aria-label="Time range">
              {TIME_RANGES.map((range) => (
                <Button
                  key={range}
                  size="sm"
                  variant={vm.range === range ? 'default' : 'outline'}
                  aria-pressed={vm.range === range}
                  onClick={() => vm.setRange(range)}
                >
                  {range === 'all' ? 'All' : range}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="outline" disabled={vm.selected.length === 0 || vm.refreshing} onClick={vm.refresh}>
              {vm.refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {vm.selected.length === 0 ? (
            <EmptyState variant="compact" type="new-object">
              <EmptyStateTitle as="p">Choose one or more time series above to plot them.</EmptyStateTitle>
            </EmptyState>
          ) : (
            <Section
              label="Chart"
              isLoading={vm.chartLoading}
              error={vm.chartError}
              onRetry={vm.refresh}
              isEmpty={plotted.length === 0}
              emptyText={`No datapoints for ${vm.selected.map((s) => s.name).join(', ')}.`}
            >
              <div className="flex flex-col gap-2">
                <TimeSeriesChart
                  series={plotted}
                  rows={vm.rows}
                  description={`ending at the latest datapoint, ${vm.range === 'all' ? 'whole history' : `last ${vm.range}`}`}
                />
                {vm.chart?.end !== undefined ? (
                  <p className="text-sm text-muted-foreground">
                    The window ends at the latest datapoint: {formatDateTime(vm.chart.end)}. Data refreshes only when you press Refresh.
                  </p>
                ) : null}
                {withoutData.map((s) => (
                  <p key={instanceKey(s.ref)} className="text-sm text-muted-foreground">
                    No datapoints for {s.name}.
                  </p>
                ))}
              </div>
            </Section>
          )}
        </div>
      </Section>
    </Panel>
  );
}
