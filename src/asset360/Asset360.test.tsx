import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { listing, makeRecentStore, makeServices, renderWithApp } from '../__mocks__/renderWithApp';
import type { Asset } from '../assets/AssetService';
import type { FileInfo } from '../files/FileService';
import type { AppServices } from '../services/AppServices';
import type { ChartData, TimeSeriesInfo } from '../timeSeries/TimeSeriesService';
import type { WorkOrder } from '../workOrders/WorkOrderService';

import { Asset360 } from './Asset360';

const AREA: Asset = { ref: { space: 'sp', externalId: 'area-1' }, tag: 'area-1', name: 'Area 1', aliases: [], path: [] };
const PUMP: Asset = {
  ref: { space: 'sp', externalId: 'pump-101' },
  tag: 'pump-101',
  name: 'PUMP-101',
  description: 'Feed pump',
  aliases: [],
  parent: AREA.ref,
  parentName: 'Area 1',
  path: [AREA.ref],
  typeName: 'Centrifugal pump',
};
const TEMP: TimeSeriesInfo = { ref: { space: 'sp', externalId: 'temp' }, name: 'Temperature', sourceUnit: 'degC', plottable: true };
const PRESSURE: TimeSeriesInfo = { ref: { space: 'sp', externalId: 'pressure' }, name: 'Pressure', plottable: true };
const PID: FileInfo = {
  ref: { space: 'sp', externalId: 'pid' },
  name: '23-PC-9109 P&ID.pdf',
  mimeType: 'application/pdf',
  isUploaded: true,
  links: ['direct'],
  lastModified: Date.UTC(2024, 5, 3),
};
const PHOTO: FileInfo = { ...PID, ref: { space: 'sp', externalId: 'photo' }, name: 'Pump photo.png', mimeType: 'image/png' };
const DOC: FileInfo = {
  ...PID,
  ref: { space: 'sp', externalId: 'doc' },
  name: 'Manual.docx',
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const ORDER: WorkOrder = {
  ref: { space: 'sp', externalId: 'wo-1' },
  identifier: 'FAO-148112',
  title: 'Replace seal',
  description: 'Seal leaking on drive end',
  status: 'Done',
  priority: '2',
  date: Date.UTC(2019, 4, 29, 9),
  startTime: Date.UTC(2019, 4, 29, 9),
  endTime: Date.UTC(2019, 5, 2, 20),
};

// pdf.js cannot run under happy-dom (no canvas or worker), so the PDF viewer is replaced by a stub that shows its URL.
vi.mock('./PdfViewer', () => ({
  PdfViewer: ({ url, name }: { url: string; name: string }) => <div role="document" aria-label={`PDF ${name}`} data-url={url} />,
}));

describe('home', () => {
  it('finds assets by typing and shows tag, name and parent context, then opens the asset page', async () => {
    const user = userEvent.setup();
    const sync = vi.fn(() => Promise.resolve(true));
    renderAsset360(services({ assets: assets({ search: () => Promise.resolve([PUMP]) }) }), undefined, sync);

    await user.type(screen.getByLabelText('Search assets by tag, name or description'), 'pump');
    const option = await screen.findByRole('option', { name: /PUMP-101/ });
    expect(option).toHaveTextContent('pump-101');
    expect(option).toHaveTextContent('Feed pump');
    expect(option).toHaveTextContent('in Area 1');

    // cmdk selects on click; user-event's pointer sequence doesn't reach its handler under happy-dom.
    fireEvent.click(option);

    expect(await screen.findByRole('heading', { level: 1, name: 'PUMP-101' })).toBeInTheDocument();
    await waitFor(() => expect(sync).toHaveBeenLastCalledWith(expect.stringContaining('"externalId":"pump-101"')));
  });

  it('explains how to refine the search when nothing matches', async () => {
    const user = userEvent.setup();
    renderAsset360(services());

    await user.type(screen.getByLabelText('Search assets by tag, name or description'), 'zzz');

    expect(await screen.findByText(/No assets match "zzz"\. Try fewer characters/)).toBeInTheDocument();
  });

  it('shows an error with a retry control when the search fails', async () => {
    const user = userEvent.setup();
    const search = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce([PUMP]);
    renderAsset360(services({ assets: assets({ search }) }));

    await user.type(screen.getByLabelText('Search assets by tag, name or description'), 'pump');
    expect(await screen.findByText(/Failed to load search results: boom/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('option', { name: /PUMP-101/ })).toBeInTheDocument();
  });

  it('lists the recently viewed assets and opens one in a click', async () => {
    const user = userEvent.setup();
    const store = makeRecentStore([{ ref: PUMP.ref, tag: 'pump-101', name: 'PUMP-101', viewedAt: 1 }]);
    renderAsset360(services({ assets: assets({}) }), undefined, undefined, store);

    await user.click(within(screen.getByRole('region', { name: 'Recently viewed' })).getByRole('button', { name: /PUMP-101/ }));

    expect(await screen.findByRole('heading', { level: 1, name: 'PUMP-101' })).toBeInTheDocument();
  });

  it('shows no recently viewed list before any asset has been opened', () => {
    renderAsset360(services());

    expect(screen.queryByRole('region', { name: 'Recently viewed' })).not.toBeInTheDocument();
  });
});

describe('asset page', () => {
  it('shows the header with tag, name, description, type and location, and remembers the asset', async () => {
    const store = makeRecentStore();
    renderAsset360(services({ assets: assets({ retrieve: () => Promise.resolve({ asset: PUMP, ancestors: [AREA] }) }) }), selected(), undefined, store);

    expect(await screen.findByRole('heading', { level: 1, name: 'PUMP-101' })).toBeInTheDocument();
    expect(screen.getByText('Feed pump')).toBeInTheDocument();
    expect(screen.getByText('Tag: pump-101')).toBeInTheDocument();
    expect(screen.getByText('Type: Centrifugal pump')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Area 1' })).toBeInTheDocument();
    await waitFor(() => expect(store.recorded.map((r) => r.tag)).toEqual(['pump-101']));
  });

  it('shows each panel in its own empty state when the asset has no linked data', async () => {
    renderAsset360(services({ assets: assets({}) }), selected());

    expect(await screen.findByText('No time series are linked to this asset.')).toBeInTheDocument();
    expect(await screen.findByText('No work orders are linked to this asset.')).toBeInTheDocument();
    expect(await screen.findByText('No documents are linked to this asset.')).toBeInTheDocument();
  });

  it('keeps the other panels working when one fails, and recovers on retry', async () => {
    const user = userEvent.setup();
    const listForAsset = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('Service unavailable'), { status: 503 }))
      .mockResolvedValueOnce(listing([PID]));
    renderAsset360(
      services({
        assets: assets({}),
        files: { listForAsset, downloadUrl: vi.fn() },
        workOrders: { listForAsset: () => Promise.resolve(listing([ORDER])) },
      }),
      selected()
    );

    expect(await screen.findByText(/Failed to load documents: Service unavailable/)).toBeInTheDocument();
    expect(await screen.findByText('Replace seal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('button', { name: '23-PC-9109 P&ID.pdf' })).toBeInTheDocument();
  });

  it('shows a no-access state instead of a generic error when the token cannot read documents', async () => {
    renderAsset360(
      services({
        assets: assets({}),
        files: { listForAsset: () => Promise.reject(Object.assign(new Error('Forbidden'), { status: 403 })), downloadUrl: vi.fn() },
      }),
      selected()
    );

    expect(await screen.findByText(/You don't have access to documents/)).toBeInTheDocument();
    expect(screen.queryByText(/Failed to load documents/)).not.toBeInTheDocument();
  });

  it('shows a not-found message with a way back for an asset that does not exist', async () => {
    renderAsset360(services(), selected());

    expect(await screen.findByText('This asset could not be found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to search' })).toBeInTheDocument();
  });

  it('goes back to the home screen', async () => {
    const user = userEvent.setup();
    renderAsset360(services({ assets: assets({}) }), selected());

    await user.click(await screen.findByRole('button', { name: 'Back to search' }));

    expect(await screen.findByLabelText('Search assets by tag, name or description')).toBeInTheDocument();
  });
});

describe('time series panel', () => {
  it('lists every series but plots none until the analyst picks one', async () => {
    const loadChart = vi.fn();
    renderAsset360(services({ assets: assets({}), timeSeries: seriesService({ loadChart }) }), selected());

    expect(await screen.findByRole('checkbox', { name: /Temperature/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Pressure/ })).not.toBeChecked();
    expect(screen.getByText('Choose one or more time series above to plot them.')).toBeInTheDocument();
    expect(loadChart).not.toHaveBeenCalled();
  });

  it('cannot plot series that are not numeric', async () => {
    const valve: TimeSeriesInfo = { ref: { space: 'sp', externalId: 'valve' }, name: 'Valve', plottable: false, type: 'state' };
    renderAsset360(services({ assets: assets({}), timeSeries: seriesService({ list: [TEMP, valve] }) }), selected());

    const valveBox = await screen.findByRole('checkbox', { name: /Valve/ });
    expect(valveBox).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('state (cannot be plotted)')).toBeInTheDocument();
  });

  it('plots the chosen series ending at the latest datapoint and refreshes only on request', async () => {
    const user = userEvent.setup();
    const loadChart = vi.fn((series: { space: string; externalId: string }[]) => Promise.resolve(chartFor(series)));
    renderAsset360(services({ assets: assets({}), timeSeries: seriesService({ loadChart }) }), selected());

    await user.click(await screen.findByRole('checkbox', { name: /Temperature/ }));

    expect(await screen.findByRole('img', { name: /Temperature .*ending at the latest datapoint, last 24h/ })).toBeInTheDocument();
    expect(screen.getByText(/The window ends at the latest datapoint/)).toBeInTheDocument();
    expect(loadChart).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(loadChart).toHaveBeenCalledTimes(2));
  });

  it('changes the time range for the chosen series', async () => {
    const user = userEvent.setup();
    const loadChart = vi.fn((series: { space: string; externalId: string }[]) => Promise.resolve(chartFor(series)));
    renderAsset360(
      services({ assets: assets({}), timeSeries: seriesService({ loadChart }) }),
      selected({ seriesIds: [TEMP.ref] })
    );

    await user.click(await screen.findByRole('button', { name: '7d' }));

    await waitFor(() => expect(loadChart).toHaveBeenCalledWith([TEMP.ref], '7d'));
  });

  it('offers the whole history with the All range', async () => {
    const user = userEvent.setup();
    const loadChart = vi.fn((series: { space: string; externalId: string }[]) => Promise.resolve(chartFor(series)));
    renderAsset360(services({ assets: assets({}), timeSeries: seriesService({ loadChart }) }), selected({ seriesIds: [TEMP.ref] }));

    await user.click(await screen.findByRole('button', { name: 'All' }));

    await waitFor(() => expect(loadChart).toHaveBeenCalledWith([TEMP.ref], 'all'));
  });

  it('shows an empty state when none of the chosen series has any datapoints', async () => {
    const loadChart = (series: { space: string; externalId: string }[]) =>
      Promise.resolve<ChartData>({ series: series.map((ref) => ({ ref, points: [], hasData: false })) });
    renderAsset360(services({ assets: assets({}), timeSeries: seriesService({ loadChart }) }), selected({ seriesIds: [TEMP.ref] }));

    expect(await screen.findByText('No datapoints for Temperature.')).toBeInTheDocument();
  });

  it('plots the series that have data and names the ones that have none', async () => {
    const loadChart = (series: { space: string; externalId: string }[]) =>
      Promise.resolve<ChartData>({
        end: 1000,
        start: 0,
        series: series.map((ref) =>
          ref.externalId === 'temp'
            ? { ref, hasData: true, points: [{ timestamp: 1000, value: 1 }] }
            : { ref, hasData: false, points: [] }
        ),
      });
    renderAsset360(
      services({ assets: assets({}), timeSeries: seriesService({ loadChart }) }),
      selected({ seriesIds: [TEMP.ref, PRESSURE.ref] })
    );

    expect(await screen.findByRole('img', { name: /Temperature/ })).toBeInTheDocument();
    expect(screen.getByText('No datapoints for Pressure.')).toBeInTheDocument();
  });
});

describe('work orders panel', () => {
  it('lists work orders with identifier, title, status and date and opens the full detail without leaving the page', async () => {
    const user = userEvent.setup();
    renderAsset360(services({ assets: assets({}), workOrders: { listForAsset: () => Promise.resolve(listing([ORDER])) } }), selected());

    expect(await screen.findByText('FAO-148112')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText(/29 May 2019/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Replace seal' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Seal leaking on drive end')).toBeInTheDocument();
    expect(within(dialog).getByText('Priority: 2')).toBeInTheDocument();
    expect(within(dialog).getByText('Work order FAO-148112')).toBeInTheDocument();
    // The modal hides the page from the accessibility tree, but it is still mounted behind the dialog.
    expect(screen.getByRole('heading', { level: 1, name: 'PUMP-101', hidden: true })).toBeInTheDocument();
  });

  it('restores an open work order from the host state', async () => {
    renderAsset360(
      services({ assets: assets({}), workOrders: { listForAsset: () => Promise.resolve(listing([ORDER])) } }),
      selected({ workOrderId: ORDER.ref })
    );

    expect(await screen.findByRole('dialog')).toHaveTextContent('Seal leaking on drive end');
  });
});

describe('documents panel', () => {
  const withFiles = (files: FileInfo[], downloadUrl = vi.fn(() => Promise.resolve('https://download.test/file'))) =>
    services({ assets: assets({}), files: { listForAsset: () => Promise.resolve(listing(files)), downloadUrl } });

  it('lists documents with name, type and last-modified date', async () => {
    renderAsset360(withFiles([PID]), selected());

    expect(await screen.findByRole('button', { name: '23-PC-9109 P&ID.pdf' })).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText(/3 Jun 2024/)).toBeInTheDocument();
  });

  it('shows a PDF inside the page, drawn from a freshly requested download link', async () => {
    const user = userEvent.setup();
    const downloadUrl = vi.fn(() => Promise.resolve('https://download.test/pid'));
    renderAsset360(withFiles([PID], downloadUrl), selected());

    await user.click(await screen.findByRole('button', { name: '23-PC-9109 P&ID.pdf' }));

    const viewer = await screen.findByRole('region', { name: 'Viewing 23-PC-9109 P&ID.pdf' });
    await waitFor(() =>
      expect(within(viewer).getByRole('document', { name: 'PDF 23-PC-9109 P&ID.pdf' })).toHaveAttribute('data-url', 'https://download.test/pid')
    );
    expect(downloadUrl).toHaveBeenCalledWith(PID.ref);
  });

  it('previews a common image inline', async () => {
    const user = userEvent.setup();
    renderAsset360(withFiles([PHOTO]), selected());

    await user.click(await screen.findByRole('button', { name: 'Pump photo.png' }));

    const viewer = await screen.findByRole('region', { name: 'Viewing Pump photo.png' });
    await waitFor(() => expect(within(viewer).getByRole('img', { name: 'Pump photo.png' })).toHaveAttribute('src', 'https://download.test/file'));
  });

  it('offers download or open-externally, with no inline viewer, for any other file type', async () => {
    const user = userEvent.setup();
    renderAsset360(withFiles([DOC]), selected());

    await user.click(await screen.findByRole('button', { name: 'Manual.docx' }));

    const viewer = await screen.findByRole('region', { name: 'Viewing Manual.docx' });
    expect(within(viewer).getByRole('button', { name: 'Download / open externally' })).toBeInTheDocument();
    expect(within(viewer).getByText(/can't be previewed here/)).toBeInTheDocument();
    expect(viewer.querySelector('iframe')).toBeNull();
    expect(viewer.querySelector('img')).toBeNull();
  });
});

function renderAsset360(
  appServices: AppServices,
  initialState?: string,
  sync?: (state: string) => Promise<boolean>,
  recent = makeRecentStore()
) {
  return renderWithApp(<Asset360 />, appServices, initialState, sync, recent);
}

function services(overrides: Partial<AppServices> = {}): AppServices {
  return makeServices(overrides);
}

function assets(overrides: Partial<AppServices['assets']>): AppServices['assets'] {
  return {
    search: () => Promise.resolve([]),
    retrieve: () => Promise.resolve({ asset: PUMP, ancestors: [] }),
    ...overrides,
  };
}

function seriesService(options: {
  list?: TimeSeriesInfo[];
  loadChart?: AppServices['timeSeries']['loadChart'];
}): AppServices['timeSeries'] {
  return {
    listForAsset: () => Promise.resolve(listing(options.list ?? [TEMP, PRESSURE])),
    loadChart: options.loadChart ?? ((series) => Promise.resolve(chartFor(series))),
  };
}

function chartFor(series: { space: string; externalId: string }[]): ChartData {
  return {
    end: Date.UTC(2024, 5, 3, 12),
    start: Date.UTC(2024, 5, 2, 12),
    series: series.map((ref) => ({
      ref,
      hasData: true,
      points: [
        { timestamp: Date.UTC(2024, 5, 3, 11), value: 1 },
        { timestamp: Date.UTC(2024, 5, 3, 12), value: 2 },
      ],
    })),
  };
}

function selected(extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ asset: PUMP.ref, ...extra });
}
