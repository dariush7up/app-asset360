import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import type { Listing } from '../cdm/paging';
import type { RecentAsset, RecentAssetsStore } from '../recent/RecentAssets';
import { RecentAssetsContext } from '../recent/recentAssetsContext';
import { AppServicesContext, type AppServices } from '../services/AppServices';
import { AppStateProvider } from '../state/AppStateProvider';

export function listing<T>(items: T[], truncated = false): Listing<T> {
  return { items, truncated };
}

export function makeServices(overrides: Partial<AppServices> = {}): AppServices {
  return {
    assets: { search: () => Promise.resolve([]), retrieve: () => Promise.resolve(null) },
    timeSeries: {
      listForAsset: () => Promise.resolve(listing([])),
      loadChart: (series) =>
        Promise.resolve({ series: series.map((ref) => ({ ref, points: [], hasData: false })) }),
    },
    files: { listForAsset: () => Promise.resolve(listing([])), downloadUrl: () => Promise.resolve('https://download.test/file') },
    workOrders: { listForAsset: () => Promise.resolve(listing([])) },
    ...overrides,
  };
}

/** A recently viewed store that keeps its entries in memory. */
export function makeRecentStore(initial: RecentAsset[] = []): RecentAssetsStore & { recorded: RecentAsset[] } {
  const recorded = [...initial];
  return {
    recorded,
    list: () => [...recorded],
    record: (asset) => void recorded.unshift({ ...asset, viewedAt: recorded.length }),
  };
}

export function makeWrapper(
  services: AppServices = makeServices(),
  initialState?: string,
  syncInternalState: (state: string) => Promise<boolean> = () => Promise.resolve(true),
  navigateExternal: (options: { url: string; openInNewTab?: boolean }) => Promise<boolean> = () => Promise.resolve(true),
  recentStore: RecentAssetsStore = makeRecentStore()
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppServicesContext.Provider value={services}>
        <RecentAssetsContext.Provider value={recentStore}>
          <AppStateProvider api={{ syncInternalState, navigateExternal }} initialState={initialState}>
            {children}
          </AppStateProvider>
        </RecentAssetsContext.Provider>
      </AppServicesContext.Provider>
    </QueryClientProvider>
  );
}

export function renderWithApp(
  ui: ReactElement,
  services?: AppServices,
  initialState?: string,
  syncInternalState?: (state: string) => Promise<boolean>,
  recentStore?: RecentAssetsStore
) {
  return render(ui, { wrapper: makeWrapper(services, initialState, syncInternalState, undefined, recentStore) });
}
