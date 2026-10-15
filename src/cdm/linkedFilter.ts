import type { FilterDefinition } from '@cognite/sdk';

import { propertyPath, type InstanceRef, type ViewRef } from './views';

/** Filter for instances of `view` whose `assets` direct-relation list contains any of the given assets. */
export function linkedToAssetFilter(view: ViewRef, assets: InstanceRef | InstanceRef[]): FilterDefinition {
  return {
    and: [{ hasData: [view] }, { containsAny: { property: propertyPath(view, 'assets'), values: Array.isArray(assets) ? assets : [assets] } }],
  };
}
