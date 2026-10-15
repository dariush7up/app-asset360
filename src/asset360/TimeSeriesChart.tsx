import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@cognite/aura/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { formatDateTime, formatTime } from '../lib/format';
import { seriesKey, type ChartRow } from '../timeSeries/chartRows';
import type { TimeSeriesInfo } from '../timeSeries/TimeSeriesService';

/** Aura's default series order: fjord, nordic, aurora, dusk, orange. */
const SERIES_RAMPS = ['fjord', 'nordic', 'aurora', 'dusk', 'orange'];

function colorOf(index: number): string {
  return `var(--chart-${SERIES_RAMPS[index % SERIES_RAMPS.length]}-color-1)`;
}

export type PlottedSeries = {
  info: TimeSeriesInfo;
  /** Position among the chosen series; names the value key in each row and picks the color. */
  index: number;
};

type TimeSeriesChartProps = {
  series: PlottedSeries[];
  rows: ChartRow[];
  /** Describes the window for screen readers, for example "ending at the latest datapoint". */
  description: string;
};

export function TimeSeriesChart({ series, rows, description }: TimeSeriesChartProps) {
  const config: ChartConfig = Object.fromEntries(
    series.map(({ info, index }) => [seriesKey(index), { label: info.name, color: colorOf(index) }])
  );

  return (
    <ChartContainer config={config} aria-label={`${series.map(({ info }) => info.name).join(', ')} ${description}`} className="h-64 w-full">
      <LineChart data={rows} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-gridlines)" />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatTime}
          tickLine={false}
          axisLine={false}
        />
        <YAxis width={56} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_label, payload) => {
                const ts = (payload?.[0]?.payload as ChartRow | undefined)?.timestamp;
                return typeof ts === 'number' ? formatDateTime(ts) : '-';
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map(({ info, index }) => (
          <Line
            key={seriesKey(index)}
            dataKey={seriesKey(index)}
            name={info.name}
            type="monotone"
            stroke={`var(--color-${seriesKey(index)})`}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
