import type { ConnectToHostAppResult, HostAppAPI } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeRecentStore, makeServices } from './__mocks__/renderWithApp';
import App from './App';
import { RecentAssetsContext } from './recent/recentAssetsContext';
import { AppServicesContext, type AppServices } from './services/AppServices';

type AppDeps = NonNullable<ComponentProps<typeof App>['deps']>;
type AppApi = Pick<HostAppAPI, 'syncInternalState' | 'navigateExternal'>;

describe('App', () => {
  it('renders the loading state while connecting to the host', () => {
    renderApp(<App deps={makeLoadingDeps()} connectToHostApp={() => new Promise<never>(() => undefined)} />);

    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('renders the asset search once connected', async () => {
    renderApp(<App deps={makeDeps()} connectToHostApp={() => Promise.resolve({ api: makeApi() })} />);

    expect(await screen.findByRole('heading', { name: 'Asset 360' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search assets by tag, name or description')).toBeInTheDocument();
  });

  it('opens the asset from a shared link', async () => {
    const initialState = JSON.stringify({ asset: { space: 'sp', externalId: 'pump-101' } });
    const services = makeServices({
      assets: {
        search: () => Promise.resolve([]),
        retrieve: () =>
          Promise.resolve({
            asset: { ref: { space: 'sp', externalId: 'pump-101' }, tag: 'pump-101', name: 'PUMP-101', aliases: [], path: [] },
            ancestors: [],
          }),
      },
    });

    renderApp(<App deps={makeDeps()} connectToHostApp={() => Promise.resolve({ api: makeApi(), initialState })} />, services);

    expect(await screen.findByRole('heading', { level: 1, name: 'PUMP-101' })).toBeInTheDocument();
  });

  it('syncs the submitted search to the host', async () => {
    const user = userEvent.setup();
    const api = makeApi();
    renderApp(<App deps={makeDeps()} connectToHostApp={() => Promise.resolve({ api })} />);

    await user.type(await screen.findByLabelText('Search assets by tag, name or description'), 'PUMP-101');

    await waitFor(() => expect(api.syncInternalState).toHaveBeenCalledWith(expect.stringContaining('"query":"PUMP-101"')));
  });
});

function renderApp(app: ReactElement, services: AppServices = makeServices()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppServicesContext.Provider value={services}>
        <RecentAssetsContext.Provider value={makeRecentStore()}>{app}</RecentAssetsContext.Provider>
      </AppServicesContext.Provider>
    </QueryClientProvider>
  );
}

function makeApi(): AppApi {
  return {
    syncInternalState: vi.fn<HostAppAPI['syncInternalState']>(() => Promise.resolve(true)),
    navigateExternal: vi.fn<HostAppAPI['navigateExternal']>(() => Promise.resolve(true)),
  };
}

function makeDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() =>
      Promise.resolve({
        api: {
          getProject: vi.fn<HostAppAPI['getProject']>(() => Promise.resolve('publicdatacdm')),
          getBaseUrl: vi.fn<HostAppAPI['getBaseUrl']>(() => Promise.resolve('https://cognite.test')),
          getAccessToken: vi.fn<HostAppAPI['getAccessToken']>(() => Promise.resolve('test-token')),
          getAppId: vi.fn<HostAppAPI['getAppId']>(() => Promise.resolve('test-app-id')),
        } as Partial<HostAppAPI> as HostAppAPI,
      })
    ),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

function makeLoadingDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() => new Promise<ConnectToHostAppResult>(() => undefined)),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}
