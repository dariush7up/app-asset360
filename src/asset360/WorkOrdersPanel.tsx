import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import type { InstanceRef } from '../cdm/views';
import { formatDateTime } from '../lib/format';
import { useWorkOrdersViewModel } from '../workOrders/useWorkOrdersViewModel';
import type { WorkOrder } from '../workOrders/WorkOrderService';

import { Panel } from './Panel';
import { Section } from './Section';
import { WorkOrderDetail } from './WorkOrderDetail';

export function WorkOrdersPanel({ asset }: { asset: InstanceRef }) {
  const vm = useWorkOrdersViewModel(asset);
  const { select } = vm;
  const columns = useMemo<ColumnDef<WorkOrder>[]>(
    () => [
      { id: 'identifier', header: 'Identifier', size: 160, accessorFn: (order) => order.identifier },
      {
        id: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" className="min-w-0 shrink truncate" onClick={() => select(row.original.ref)}>
            {row.original.title}
          </Button>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        size: 130,
        cell: ({ row }) => (row.original.status ? <Badge variant="inProgress">{row.original.status}</Badge> : null),
      },
      {
        id: 'date',
        header: 'Date',
        size: 190,
        accessorFn: (order) => (order.date === undefined ? '-' : formatDateTime(order.date)),
      },
    ],
    [select]
  );

  return (
    <Panel title="Work orders">
      <Section
        label="Work orders"
        isLoading={vm.isLoading}
        error={vm.error}
        onRetry={vm.retry}
        isEmpty={vm.workOrders.length === 0}
        emptyText="No work orders are linked to this asset."
        truncated={vm.truncated}
      >
        <DataGrid
          aria-label="Work orders, most recent first"
          data={vm.workOrders}
          columns={columns}
          getRowId={(order) => `${order.ref.space}:${order.ref.externalId}`}
          size="compact"
        />
      </Section>
      <WorkOrderDetail workOrder={vm.selected} onClose={vm.clearSelection} />
    </Panel>
  );
}
