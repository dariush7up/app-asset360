import type { CogniteClient, NodeOrEdgeSearchRequest } from '@cognite/sdk';

import { asInstanceRef, asInstanceRefList, asString, asStringList, readProperties } from '../cdm/properties';
import { CDM_VIEWS, instanceKey, type InstanceRef } from '../cdm/views';

export type Asset = {
  ref: InstanceRef;
  /** Tag: the asset's external id. */
  tag: string;
  name: string;
  description?: string;
  aliases: string[];
  parent?: InstanceRef;
  /** Name of the parent asset, for disambiguating similarly named assets in search results. */
  parentName?: string;
  /** Ancestors from the root down, as stored on the asset. */
  path: InstanceRef[];
  /** The asset's type and class nodes, when set; their names are looked up separately. */
  typeRef?: InstanceRef;
  classRef?: InstanceRef;
  /** Name of the asset's type and class, when set. */
  typeName?: string;
  className?: string;
};

export type AssetDetails = { asset: Asset; ancestors: Asset[] };

export interface AssetService {
  /** Ranked matches for the text, each with its parent's name. */
  search(query: string): Promise<Asset[]>;
  retrieve(ref: InstanceRef): Promise<AssetDetails | null>;
}

/** Narrow slice of CogniteClient that this service depends on. */
export interface AssetClient {
  instances: Pick<CogniteClient['instances'], 'search' | 'retrieve'>;
}

const SEARCH_LIMIT = 25;
// The SDK's search request type predates the `operator` field. The docs say the default operator changes
// from OR to AND in November 2026, so request AND explicitly.
type AssetSearchRequest = NodeOrEdgeSearchRequest & { operator: 'AND' | 'OR' };

export class ApiAssetService implements AssetService {
  constructor(private readonly client: AssetClient) {}

  async search(query: string): Promise<Asset[]> {
    const text = query.trim();
    if (!text) return [];
    const request: AssetSearchRequest = {
      view: CDM_VIEWS.asset,
      query: text,
      properties: ['name', 'description'],
      instanceType: 'node',
      limit: SEARCH_LIMIT,
      operator: 'AND',
    };
    const response = await this.client.instances.search(request);
    const assets = response.items.map(toAsset);
    return this.withParentNames(assets);
  }

  async retrieve(ref: InstanceRef): Promise<AssetDetails | null> {
    const [found] = await this.retrieveAssets([ref]);
    if (!found) return null;
    const ancestorRefs = found.path.filter((p) => instanceKey(p) !== instanceKey(ref));
    const [ancestors, labels] = await Promise.all([
      ancestorRefs.length > 0 ? this.retrieveAssets(ancestorRefs) : Promise.resolve([]),
      this.retrieveLabels(found),
    ]);
    return { asset: { ...found, ...labels }, ancestors };
  }

  private async retrieveAssets(refs: InstanceRef[]): Promise<Asset[]> {
    const response = await this.client.instances.retrieve({
      items: refs.map((ref) => ({ instanceType: 'node', ...ref })),
      sources: [{ source: CDM_VIEWS.asset }],
    });
    return response.items.map(toAsset);
  }

  private async withParentNames(assets: Asset[]): Promise<Asset[]> {
    const parents = new Map<string, InstanceRef>();
    for (const asset of assets) {
      if (asset.parent) parents.set(instanceKey(asset.parent), asset.parent);
    }
    if (parents.size === 0) return assets;
    const names = new Map((await this.retrieveAssets([...parents.values()])).map((p) => [instanceKey(p.ref), p.name]));
    return assets.map((asset) => ({ ...asset, parentName: asset.parent ? names.get(instanceKey(asset.parent)) : undefined }));
  }

  /** Names of the asset's type and class, which live on separate nodes. Missing ones are left out. */
  private async retrieveLabels(asset: Asset): Promise<Pick<Asset, 'typeName' | 'className'>> {
    const typeRef = asset.typeRef;
    const classRef = asset.classRef;
    if (!typeRef && !classRef) return {};
    const refs = [typeRef, classRef].filter((ref): ref is InstanceRef => ref !== undefined);
    const response = await this.client.instances.retrieve({
      items: refs.map((ref) => ({ instanceType: 'node', ...ref })),
      sources: [{ source: CDM_VIEWS.assetType }, { source: CDM_VIEWS.assetClass }],
    });
    const nameOf = (ref: InstanceRef | undefined, view: typeof CDM_VIEWS.assetType) => {
      const node = response.items.find((item) => ref && instanceKey(item) === instanceKey(ref));
      return node ? asString(readProperties(node, view).name) : undefined;
    };
    return { typeName: nameOf(typeRef, CDM_VIEWS.assetType), className: nameOf(classRef, CDM_VIEWS.assetClass) };
  }
}

function toAsset(node: Parameters<typeof readProperties>[0] & InstanceRef): Asset {
  const props = readProperties(node, CDM_VIEWS.asset);
  const ref = { space: node.space, externalId: node.externalId };
  return {
    ref,
    tag: node.externalId,
    name: asString(props.name) ?? node.externalId,
    description: asString(props.description),
    aliases: asStringList(props.aliases),
    parent: asInstanceRef(props.parent),
    path: asInstanceRefList(props.path),
    typeRef: asInstanceRef(props.type),
    classRef: asInstanceRef(props.assetClass),
  };
}
