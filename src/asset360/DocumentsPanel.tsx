import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import type { InstanceRef } from '../cdm/views';
import { fileTypeLabel, isPidCandidate, type FileInfo } from '../files/FileService';
import { useFilesViewModel } from '../files/useFilesViewModel';
import { formatDateTime } from '../lib/format';

import { FileViewer } from './FileViewer';
import { Panel } from './Panel';
import { Section } from './Section';

type DocumentsPanelProps = {
  asset: InstanceRef;
  /** The asset's parents; files linked to them (such as a unit-level P&ID) also apply to the asset. */
  ancestors: InstanceRef[];
};

export function DocumentsPanel({ asset, ancestors }: DocumentsPanelProps) {
  const vm = useFilesViewModel(asset, ancestors);
  const { open } = vm;
  const columns = useMemo<ColumnDef<FileInfo>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" className="min-w-0 shrink truncate" disabled={!row.original.isUploaded} onClick={() => open(row.original.ref)}>
            {row.original.name}
          </Button>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        size: 170,
        cell: ({ row }) => (
          <div className="flex gap-1">
            {fileTypeLabel(row.original.mimeType) ? (
              <Badge variant="mountain">{fileTypeLabel(row.original.mimeType)}</Badge>
            ) : null}
            {isPidCandidate(row.original) ? <Badge variant="secondary">P&ID</Badge> : null}
          </div>
        ),
      },
      {
        id: 'modified',
        header: 'Last modified',
        size: 190,
        accessorFn: (file) => (file.lastModified ? formatDateTime(file.lastModified) : '-'),
      },
    ],
    [open]
  );

  return (
    <Panel title="Documents">
      <Section
        label="Documents"
        isLoading={vm.isLoading}
        error={vm.error}
        onRetry={vm.retry}
        isEmpty={vm.files.length === 0}
        emptyText="No documents are linked to this asset."
        truncated={vm.truncated}
      >
        <div className="flex flex-col gap-3">
          <DataGrid
            aria-label="Documents"
            data={vm.files}
            columns={columns}
            getRowId={(file) => `${file.ref.space}:${file.ref.externalId}`}
            size="compact"
          />
          {vm.openFile ? (
            <FileViewer
              file={vm.openFile}
              url={vm.openFileUrl}
              isLoading={vm.urlLoading}
              error={vm.urlError}
              onOpenExternally={vm.openInNewTab}
              onClose={vm.close}
            />
          ) : null}
        </div>
      </Section>
    </Panel>
  );
}
