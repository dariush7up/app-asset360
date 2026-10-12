import { createContext, useContext } from 'react';

import type { RecentAssetsStore } from './RecentAssets';

export const RecentAssetsContext = createContext<RecentAssetsStore | null>(null);

export function useRecentAssets(): RecentAssetsStore {
  const store = useContext(RecentAssetsContext);
  if (!store) throw new Error('useRecentAssets must be used inside RecentAssetsProvider');
  return store;
}
