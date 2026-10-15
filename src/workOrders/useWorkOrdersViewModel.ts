import { useQuery } from '@tanstack/react-query';

import { instanceKey, type InstanceRef } from '../cdm/views';
import { queryState, type PanelState } from '../lib/queryState';
import { useAppServices } from '../services/AppServices';
import { useAppState } from '../state/appStateContext';

import type { WorkOrder } from './WorkOrderService';

export type WorkOrdersViewModel = PanelState & {
  workOrders: WorkOrder[];
  /** More work orders exist than were loaded. */
  truncated: boolean;
  /** The work order whose detail is shown, restored from the host state. */
  selected: WorkOrder | null;
  select: (ref: InstanceRef) => void;
  clearSelection: () => void;
};

export function useWorkOrdersViewModel(asset: InstanceRef): WorkOrdersViewModel {
  const { workOrders: service } = useAppServices();
  const { state, update } = useAppState();
  const query = useQuery({
    queryKey: ['workOrders', instanceKey(asset)],
    queryFn: () => service.listForAsset(asset),
  });
  const workOrders = query.data?.items ?? [];
  const selected =
    workOrders.find((w) => state.workOrderId && instanceKey(w.ref) === instanceKey(state.workOrderId)) ?? null;

  return {
    ...queryState(query),
    workOrders,
    truncated: query.data?.truncated ?? false,
    selected,
    select: (ref) => update({ workOrderId: ref }),
    clearSelection: () => update({ workOrderId: undefined }),
  };
}
