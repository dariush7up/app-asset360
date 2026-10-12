import { useQuery } from '@tanstack/react-query';

import type { InstanceRef } from '../cdm/views';
import { queryState, type PanelState } from '../lib/queryState';
import { useAppServices } from '../services/AppServices';
import { useAppState } from '../state/appStateContext';

import type { Asset } from './AssetService';

export type AssetSearchViewModel = PanelState & {
  query: string;
  results: Asset[];
  search: (text: string) => void;
  select: (ref: InstanceRef) => void;
};

export function useAssetSearchViewModel(): AssetSearchViewModel {
  const { assets } = useAppServices();
  const { state, update } = useAppState();
  const enabled = state.query.trim().length > 0;
  const query = useQuery({
    queryKey: ['assets', 'search', state.query.trim()],
    queryFn: () => assets.search(state.query),
    enabled,
  });

  return {
    ...queryState(query),
    isLoading: enabled && query.isLoading,
    query: state.query,
    results: query.data ?? [],
    search: (text) => update({ query: text }),
    select: (ref) => update({ asset: ref, seriesIds: [], workOrderId: undefined, fileId: undefined }),
  };
}
