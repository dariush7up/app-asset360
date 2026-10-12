import { useMemo, type ReactNode } from 'react';

import { LocalStorageRecentAssets } from './RecentAssets';
import { RecentAssetsContext } from './recentAssetsContext';

/** Backs the recently viewed list with the browser's localStorage unless a store is already injected. */
export function RecentAssetsProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => new LocalStorageRecentAssets(window.localStorage), []);
  return <RecentAssetsContext.Provider value={store}>{children}</RecentAssetsContext.Provider>;
}
