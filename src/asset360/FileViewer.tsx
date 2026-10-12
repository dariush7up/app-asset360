import { Button } from '@cognite/aura/components/button';

import { previewKind, type FileInfo } from '../files/FileService';

import { PdfViewer } from './PdfViewer';

type FileViewerProps = {
  file: FileInfo;
  /** Temporary download URL, once it has been fetched. */
  url: string | null;
  isLoading: boolean;
  error: Error | null;
  onOpenExternally: () => void;
  onClose: () => void;
};

/** Inline preview for PDFs and common images; everything else offers download or open-externally. */
export function FileViewer({ file, url, isLoading, error, onOpenExternally, onClose }: FileViewerProps) {
  const kind = previewKind(file.mimeType);

  return (
    <div className="flex flex-col gap-2 border-t pt-3" role="region" aria-label={`Viewing ${file.name}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{file.name}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={!url} onClick={onOpenExternally}>
            {kind === 'none' ? 'Download / open externally' : 'Open in new tab'}
          </Button>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      {isLoading ? <p className="text-muted-foreground">Preparing file...</p> : null}
      {error ? <p>Failed to open file: {error.message}</p> : null}
      {url && kind === 'image' ? <img src={url} alt={file.name} className="max-h-[70vh] w-full object-contain" /> : null}
      {url && kind === 'pdf' ? <PdfViewer url={url} name={file.name} /> : null}
      {kind === 'none' ? (
        <p className="text-muted-foreground">This file type can't be previewed here. Use the button to download or open it.</p>
      ) : null}
    </div>
  );
}
