import { describe, expect, it } from 'vitest';

import {
  LocalStorageRecentAssets,
  MAX_RECENT_ASSETS,
  RECENT_ASSETS_STORAGE_KEY,
  type KeyValueStorage,
} from './RecentAssets';

describe(LocalStorageRecentAssets.name, () => {
  it('starts empty', () => {
    expect(new LocalStorageRecentAssets(memoryStorage()).list()).toEqual([]);
  });

  it('records assets, most recent first, and survives a new store instance on the same storage', () => {
    const storage = memoryStorage();
    const first = new LocalStorageRecentAssets(storage, () => 1);
    first.record(asset('a'));
    first.record(asset('b'));

    const reopened = new LocalStorageRecentAssets(storage);

    expect(reopened.list().map((item) => item.tag)).toEqual(['b', 'a']);
  });

  it('moves an asset that is viewed again to the front without duplicating it', () => {
    const store = new LocalStorageRecentAssets(memoryStorage());
    store.record(asset('a'));
    store.record(asset('b'));
    store.record(asset('a'));

    expect(store.list().map((item) => item.tag)).toEqual(['a', 'b']);
  });

  it('keeps only the 10 most recent, dropping the oldest first', () => {
    const store = new LocalStorageRecentAssets(memoryStorage());
    for (let i = 0; i < MAX_RECENT_ASSETS + 3; i++) store.record(asset(`asset-${i}`));

    const tags = store.list().map((item) => item.tag);

    expect(tags).toHaveLength(MAX_RECENT_ASSETS);
    expect(tags[0]).toBe('asset-12');
    expect(tags).not.toContain('asset-0');
  });

  it('ignores corrupt or malformed stored data', () => {
    const storage = memoryStorage();
    storage.setItem(RECENT_ASSETS_STORAGE_KEY, '{not json');
    expect(new LocalStorageRecentAssets(storage).list()).toEqual([]);

    storage.setItem(RECENT_ASSETS_STORAGE_KEY, JSON.stringify([{ tag: 'x' }, 'y']));
    expect(new LocalStorageRecentAssets(storage).list()).toEqual([]);
  });

  it('does not throw when storage is unavailable', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    const store = new LocalStorageRecentAssets(broken);

    expect(store.list()).toEqual([]);
    expect(() => store.record(asset('a'))).not.toThrow();
  });
});

function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
}

function asset(tag: string) {
  return { ref: { space: 'sp', externalId: tag }, tag, name: `Name ${tag}` };
}
