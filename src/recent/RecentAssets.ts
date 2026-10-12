import { asInstanceRef, asString } from '../cdm/properties';
import { instanceKey, type InstanceRef } from '../cdm/views';

export const MAX_RECENT_ASSETS = 10;
export const RECENT_ASSETS_STORAGE_KEY = 'asset360.recentAssets';

export type RecentAsset = {
  ref: InstanceRef;
  /** Tag or external id, as shown in search results. */
  tag: string;
  name: string;
  description?: string;
  viewedAt: number;
};

export interface RecentAssetsStore {
  /** Most recently viewed first. */
  list(): RecentAsset[];
  record(asset: Omit<RecentAsset, 'viewedAt'>): void;
}

/** The slice of `Storage` the store needs. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRecentAsset(value: unknown): RecentAsset | null {
  if (!isRecord(value)) return null;
  const ref = asInstanceRef(value.ref);
  const tag = asString(value.tag);
  const name = asString(value.name);
  if (!ref || !tag || !name || typeof value.viewedAt !== 'number') return null;
  return { ref, tag, name, description: asString(value.description), viewedAt: value.viewedAt };
}

/** Keeps the last few viewed assets in browser-local storage, so they survive reloads and restarts. */
export class LocalStorageRecentAssets implements RecentAssetsStore {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly now: () => number = Date.now
  ) {}

  list(): RecentAsset[] {
    let raw: string | null;
    try {
      raw = this.storage.getItem(RECENT_ASSETS_STORAGE_KEY);
    } catch {
      return [];
    }
    if (!raw) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const asset = toRecentAsset(item);
      return asset ? [asset] : [];
    });
  }

  record(asset: Omit<RecentAsset, 'viewedAt'>): void {
    const key = instanceKey(asset.ref);
    const others = this.list().filter((item) => instanceKey(item.ref) !== key);
    const next = [{ ...asset, viewedAt: this.now() }, ...others].slice(0, MAX_RECENT_ASSETS);
    try {
      this.storage.setItem(RECENT_ASSETS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be full or blocked (private mode); the recent list is a convenience, so ignore it.
    }
  }
}
