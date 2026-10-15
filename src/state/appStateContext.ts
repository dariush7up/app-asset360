import { createContext, useContext } from 'react';

import type { AppState } from './appState';

export type AppStateStore = {
  state: AppState;
  /** Applies a partial update and pushes the new state to the host so the URL stays in sync. */
  update: (patch: Partial<AppState>) => void;
  /** Opens an https URL in a new browser tab through the host. */
  openExternal: (url: string) => void;
};

export const AppStateContext = createContext<AppStateStore | null>(null);

export function useAppState(): AppStateStore {
  const store = useContext(AppStateContext);
  if (!store) throw new Error('useAppState must be used inside AppStateProvider');
  return store;
}
