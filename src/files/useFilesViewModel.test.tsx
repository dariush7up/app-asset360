import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { listing, makeServices, makeWrapper } from '../__mocks__/renderWithApp';
import type { Listing } from '../cdm/paging';

import type { FileInfo } from './FileService';
import { useFilesViewModel } from './useFilesViewModel';

const ASSET = { space: 'sp', externalId: 'pump' };
const FILE: FileInfo = { ref: { space: 'sp', externalId: 'pid' }, name: 'P&ID', isUploaded: true, links: ['direct'] };

describe(useFilesViewModel.name, () => {
  it('starts loading, then lists the files and passes the ancestors through', async () => {
    const listForAsset = vi.fn(() => Promise.resolve(listing([FILE])));
    const ancestors = [{ space: 'sp', externalId: 'unit' }];
    const { result } = setup({ listForAsset }, undefined, ancestors);

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.files).toEqual([FILE]));
    expect(listForAsset).toHaveBeenCalledWith(ASSET, ancestors);
  });

  it('reports truncation and list errors', async () => {
    const truncated = setup({ listForAsset: () => Promise.resolve(listing([FILE], true)) });
    await waitFor(() => expect(truncated.result.current.truncated).toBe(true));

    const failed = setup({ listForAsset: () => Promise.reject(new Error('403')) });
    await waitFor(() => expect(failed.result.current.error?.message).toBe('403'));
  });

  it('requests a fresh download link for the file restored from the host state', async () => {
    const downloadUrl = vi.fn(() => Promise.resolve('https://download.test/pid'));
    const { result } = setup({ downloadUrl }, JSON.stringify({ fileId: FILE.ref }));

    await waitFor(() => expect(result.current.openFileUrl).toBe('https://download.test/pid'));
    expect(result.current.openFile).toEqual(FILE);
    expect(downloadUrl).toHaveBeenCalledWith(FILE.ref);
  });

  it('exposes a download link error', async () => {
    const { result } = setup({ downloadUrl: () => Promise.reject(new Error('expired')) }, JSON.stringify({ fileId: FILE.ref }));

    await waitFor(() => expect(result.current.urlError?.message).toBe('expired'));
  });

  it('syncs opening and closing a file and opens the link in a new tab through the host', async () => {
    const sync = vi.fn(() => Promise.resolve(true));
    const navigateExternal = vi.fn(() => Promise.resolve(true));
    const { result } = setup({}, undefined, [], sync, navigateExternal);
    await waitFor(() => expect(result.current.files).toHaveLength(1));

    act(() => result.current.open(FILE.ref));
    await waitFor(() => expect(result.current.openFileUrl).toBe('https://download.test/pid'));
    act(() => result.current.openInNewTab());
    expect(navigateExternal).toHaveBeenCalledWith({ url: 'https://download.test/pid', openInNewTab: true });

    act(() => result.current.close());
    await waitFor(() => expect(result.current.openFile).toBeNull());
    expect(sync).toHaveBeenCalledWith(expect.stringContaining('"externalId":"pid"'));
  });
});

type Overrides = {
  listForAsset?: () => Promise<Listing<FileInfo>>;
  downloadUrl?: () => Promise<string>;
};

function setup(
  overrides: Overrides,
  initialState?: string,
  ancestors: { space: string; externalId: string }[] = [],
  sync?: () => Promise<boolean>,
  navigateExternal?: (options: { url: string; openInNewTab?: boolean }) => Promise<boolean>
) {
  const services = makeServices({
    files: {
      listForAsset: overrides.listForAsset ?? (() => Promise.resolve(listing([FILE]))),
      downloadUrl: overrides.downloadUrl ?? (() => Promise.resolve('https://download.test/pid')),
    },
  });
  return renderHook(() => useFilesViewModel(ASSET, ancestors), {
    wrapper: makeWrapper(services, initialState, sync, navigateExternal),
  });
}
