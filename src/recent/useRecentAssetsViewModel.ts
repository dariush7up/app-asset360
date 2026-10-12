import { useMemo } from 'react';

import type { InstanceRef } from '../cdm/views';
import { useAppState } from '../state/appStateContext';

import type { RecentAsset } from './RecentAssets';
import { useRecentAssets } from './recentAssetsContext';

export type RecentAssetsViewModel = {
  recent: RecentAsset[];
  open: (ref: InstanceRef) => void;
};

export function useRecentAssetsViewModel(): RecentAssetsViewModel {
  const store = useRecentAssets();
  const { update } = useAppState();
  // Read when the home screen mounts; the list only changes while an asset page is open.
  const recent = useMemo(() => store.list(), [store]);

  return {
    recent,
    open: (ref) => update({ asset: ref, seriesIds: [], workOrderId: undefined, fileId: undefined }),
  };
}
