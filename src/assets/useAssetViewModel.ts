import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { instanceKey, type InstanceRef } from '../cdm/views';
import { queryState, type PanelState } from '../lib/queryState';
import { useRecentAssets } from '../recent/recentAssetsContext';
import { useAppServices } from '../services/AppServices';
import { useAppState } from '../state/appStateContext';

import type { AssetDetails } from './AssetService';

export type AssetViewModel = PanelState & {
  /** Null when no asset is selected. */
  selected: InstanceRef | null;
  details: AssetDetails | null;
  /** True when an asset is selected but it could not be found. */
  notFound: boolean;
  open: (ref: InstanceRef) => void;
  close: () => void;
};

export function useAssetViewModel(): AssetViewModel {
  const { assets } = useAppServices();
  const recent = useRecentAssets();
  const { state, update } = useAppState();
  const selected = state.asset ?? null;

  const detailsQuery = useQuery({
    queryKey: ['asset', selected ? instanceKey(selected) : ''],
    queryFn: () => (selected ? assets.retrieve(selected) : Promise.resolve(null)),
    enabled: selected !== null,
  });
  const details = detailsQuery.data ?? null;

  // Remember every asset the analyst opens, so it shows up in the recently viewed list.
  useEffect(() => {
    if (!details) return;
    const { asset } = details;
    recent.record({ ref: asset.ref, tag: asset.tag, name: asset.name, description: asset.description });
  }, [details, recent]);

  return {
    ...queryState(detailsQuery),
    selected,
    details,
    notFound: selected !== null && detailsQuery.isSuccess && details === null,
    open: (ref) => update({ asset: ref, seriesIds: [], workOrderId: undefined, fileId: undefined }),
    close: () => update({ asset: undefined, seriesIds: [], workOrderId: undefined, fileId: undefined }),
  };
}
