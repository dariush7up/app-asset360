import type { NodeDefinition, PropertyValueGroupV3 } from '@cognite/sdk';

import { viewKey, type InstanceRef, type ViewRef } from '../cdm/views';

/** A node with the given properties under one view, for faking data modeling responses. */
export function makeNode(ref: InstanceRef, view: ViewRef, properties: PropertyValueGroupV3): NodeDefinition {
  return {
    instanceType: 'node',
    ...ref,
    version: 1,
    createdTime: 0,
    lastUpdatedTime: 0,
    properties: { [view.space]: { [viewKey(view)]: properties } },
  };
}
