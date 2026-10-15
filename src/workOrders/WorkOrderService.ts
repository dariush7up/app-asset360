import type { CogniteClient, FilterDefinition } from '@cognite/sdk';

import { PAGE_SIZE, queryPages, type Listing } from '../cdm/paging';
import { asString, asText, asTimestamp, readProperties } from '../cdm/properties';
import { allPropertiesFrom, CDM_VIEWS, propertyPath, type InstanceRef } from '../cdm/views';

export type WorkOrder = {
  ref: InstanceRef;
  /** Identifier in the source system (for example the SAP order number), else the external id. */
  identifier: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  startTime?: number;
  endTime?: number;
  scheduledStartTime?: number;
  scheduledEndTime?: number;
  sourceCreatedTime?: number;
  sourceUpdatedTime?: number;
  /** The date used for sorting and for the list: start, else scheduled start, else creation. */
  date?: number;
};

export interface WorkOrderService {
  /** Work orders for the asset, most recent first. */
  listForAsset(asset: InstanceRef): Promise<Listing<WorkOrder>>;
}

/** Narrow slice of CogniteClient that this service depends on. */
export interface WorkOrderClient {
  instances: Pick<CogniteClient['instances'], 'query'>;
}

const VIEW = CDM_VIEWS.maintenanceOrder;

/** Work orders that list the asset among their assets, or have it as the main asset. */
function forAssetFilter(asset: InstanceRef): FilterDefinition {
  return {
    and: [
      { hasData: [VIEW] },
      {
        or: [
          { containsAny: { property: propertyPath(VIEW, 'assets'), values: [asset] } },
          { equals: { property: propertyPath(VIEW, 'mainAsset'), value: asset } },
        ],
      },
    ],
  };
}

export class ApiWorkOrderService implements WorkOrderService {
  constructor(private readonly client: WorkOrderClient) {}

  async listForAsset(asset: InstanceRef): Promise<Listing<WorkOrder>> {
    const RESULT = 'workOrders';
    const { items, truncated } = await queryPages(RESULT, (cursors) =>
      this.client.instances.query({
        with: {
          [RESULT]: {
            nodes: { filter: forAssetFilter(asset) },
            limit: PAGE_SIZE,
          },
        },
        select: { [RESULT]: { sources: allPropertiesFrom(VIEW) } },
        cursors,
      })
    );
    return { items: items.map(toWorkOrder).sort(byRecency), truncated };
  }
}

function toWorkOrder(node: { space: string; externalId: string } & Parameters<typeof readProperties>[0]): WorkOrder {
  const props = readProperties(node, VIEW);
  const startTime = asTimestamp(props.startTime);
  const scheduledStartTime = asTimestamp(props.scheduledStartTime);
  const sourceCreatedTime = asTimestamp(props.sourceCreatedTime);
  return {
    ref: { space: node.space, externalId: node.externalId },
    identifier: asString(props.sourceId) ?? node.externalId,
    title: asString(props.name) ?? node.externalId,
    description: asString(props.description),
    status: asText(props.status),
    priority: asText(props.priority),
    type: asText(props.type),
    startTime,
    endTime: asTimestamp(props.endTime),
    scheduledStartTime,
    scheduledEndTime: asTimestamp(props.scheduledEndTime),
    sourceCreatedTime,
    sourceUpdatedTime: asTimestamp(props.sourceUpdatedTime),
    date: startTime ?? scheduledStartTime ?? sourceCreatedTime,
  };
}

/** Newest first; work orders without any date go last. */
function byRecency(a: WorkOrder, b: WorkOrder): number {
  return (b.date ?? Number.NEGATIVE_INFINITY) - (a.date ?? Number.NEGATIVE_INFINITY);
}
