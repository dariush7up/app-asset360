export type ViewRef = { space: string; externalId: string; version: string; type: 'view' };
export type InstanceRef = { space: string; externalId: string };

const cdmView = (externalId: string): ViewRef => ({ space: 'cdf_cdm', externalId, version: 'v1', type: 'view' });

const idmView = (externalId: string): ViewRef => ({ space: 'cdf_idm', externalId, version: 'v1', type: 'view' });

export const CDM_VIEWS = {
  asset: cdmView('CogniteAsset'),
  assetClass: cdmView('CogniteAssetClass'),
  assetType: cdmView('CogniteAssetType'),
  timeSeries: cdmView('CogniteTimeSeries'),
  file: cdmView('CogniteFile'),
  activity: cdmView('CogniteActivity'),
  /** Work orders; implements CogniteActivity and adds status, priority and type. */
  maintenanceOrder: idmView('CogniteMaintenanceOrder'),
} as const;

/** Key under which a view's properties appear in an instance's `properties`, e.g. `CogniteAsset/v1`. */
export function viewKey(view: ViewRef): string {
  return `${view.externalId}/${view.version}`;
}

/** Property path for use in filters: `[space, 'View/version', property]`. */
export function propertyPath(view: ViewRef, property: string): [string, string, string] {
  return [view.space, viewKey(view), property];
}

export function instanceKey(ref: InstanceRef): string {
  return `${ref.space}:${ref.externalId}`;
}

/** Source selector for `instances.query` select — returns all properties from the view. */
export function allPropertiesFrom(view: ViewRef): [{ source: ViewRef; properties: string[] }] {
  return [{ source: view, properties: [] }];
}
