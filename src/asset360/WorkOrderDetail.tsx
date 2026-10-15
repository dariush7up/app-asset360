import { Badge } from '@cognite/aura/components/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@cognite/aura/components/dialog';

import { formatDateTime } from '../lib/format';
import type { WorkOrder } from '../workOrders/WorkOrderService';

type WorkOrderDetailProps = {
  /** The work order to show, or null to keep the dialog closed. */
  workOrder: WorkOrder | null;
  onClose: () => void;
};

const DATE_FIELDS: [string, keyof WorkOrder][] = [
  ['Started', 'startTime'],
  ['Ended', 'endTime'],
  ['Scheduled start', 'scheduledStartTime'],
  ['Scheduled end', 'scheduledEndTime'],
  ['Created in source', 'sourceCreatedTime'],
  ['Updated in source', 'sourceUpdatedTime'],
];

/** Full detail of one work order, shown over the asset page so the analyst never leaves it. */
export function WorkOrderDetail({ workOrder, onClose }: WorkOrderDetailProps) {
  return (
    <Dialog open={workOrder !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent closeButtonLabel="Close work order">
        {workOrder ? (
          <>
            <DialogHeader>
              <DialogTitle>{workOrder.title}</DialogTitle>
              <DialogDescription>Work order {workOrder.identifier}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              {workOrder.status ? <Badge variant="inProgress">Status: {workOrder.status}</Badge> : null}
              {workOrder.priority ? <Badge variant="mountain">Priority: {workOrder.priority}</Badge> : null}
              {workOrder.type ? <Badge variant="mountain">Type: {workOrder.type}</Badge> : null}
            </div>
            {workOrder.description ? <p>{workOrder.description}</p> : null}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {DATE_FIELDS.flatMap(([label, field]) => {
                const value = workOrder[field];
                return typeof value === 'number'
                  ? [
                      <dt key={`${field}-label`} className="text-muted-foreground">
                        {label}
                      </dt>,
                      <dd key={field}>{formatDateTime(value)}</dd>,
                    ]
                  : [];
              })}
            </dl>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
