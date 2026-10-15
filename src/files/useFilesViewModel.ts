import { useQuery } from '@tanstack/react-query';

import { instanceKey, type InstanceRef } from '../cdm/views';
import { queryState, type PanelState } from '../lib/queryState';
import { useAppServices } from '../services/AppServices';
import { useAppState } from '../state/appStateContext';

import type { FileInfo } from './FileService';

export type FilesViewModel = PanelState & {
  files: FileInfo[];
  truncated: boolean;
  /** The file shown in the viewer, restored from the host state. */
  openFile: FileInfo | null;
  /** Temporary download URL for the open file. */
  openFileUrl: string | null;
  urlLoading: boolean;
  urlError: Error | null;
  open: (ref: InstanceRef) => void;
  close: () => void;
  /** Opens the open file's download URL in a new browser tab. */
  openInNewTab: () => void;
};

/** `ancestors` are the asset's parents, whose linked files (such as a unit-level P&ID) also apply to it. */
export function useFilesViewModel(asset: InstanceRef, ancestors: InstanceRef[]): FilesViewModel {
  const { files: fileService } = useAppServices();
  const { state, update, openExternal } = useAppState();

  const listQuery = useQuery({
    queryKey: ['files', instanceKey(asset), ancestors.map(instanceKey)],
    queryFn: () => fileService.listForAsset(asset, ancestors),
  });
  const files = listQuery.data?.items ?? [];
  const openFile = files.find((f) => state.fileId && instanceKey(f.ref) === instanceKey(state.fileId)) ?? null;

  // Download links expire within seconds, so never reuse a cached one.
  const urlQuery = useQuery({
    queryKey: ['files', 'url', openFile ? instanceKey(openFile.ref) : ''],
    queryFn: () => (openFile ? fileService.downloadUrl(openFile.ref) : Promise.resolve(null)),
    enabled: openFile !== null,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    ...queryState(listQuery),
    files,
    truncated: listQuery.data?.truncated ?? false,
    openFile,
    openFileUrl: urlQuery.data ?? null,
    urlLoading: openFile !== null && urlQuery.isLoading,
    urlError: urlQuery.error,
    open: (ref) => update({ fileId: ref }),
    close: () => update({ fileId: undefined }),
    openInNewTab: () => {
      if (urlQuery.data) openExternal(urlQuery.data);
    },
  };
}
