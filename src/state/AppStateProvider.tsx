import type { HostAppAPI } from '@cognite/app-sdk';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { parseAppState, type AppState } from './appState';
import { AppStateContext } from './appStateContext';

type AppStateHost = Pick<HostAppAPI, 'syncInternalState' | 'navigateExternal'>;

type AppStateProviderProps = { api: AppStateHost | null; initialState?: string; children: ReactNode };

export function AppStateProvider({ api, initialState, children }: AppStateProviderProps) {
  const [state, setState] = useState<AppState>(() => parseAppState(initialState));

  const update = useCallback(
    (patch: Partial<AppState>) => {
      const next = { ...state, ...patch };
      setState(next);
      void api?.syncInternalState(JSON.stringify(next));
    },
    [api, state]
  );

  const openExternal = useCallback((url: string) => void api?.navigateExternal({ url, openInNewTab: true }), [api]);

  const store = useMemo(() => ({ state, update, openExternal }), [state, update, openExternal]);
  return <AppStateContext.Provider value={store}>{children}</AppStateContext.Provider>;
}
