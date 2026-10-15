import { Button } from '@cognite/aura/components/button';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import { useElementWidth } from '../lib/useElementWidth';

// The worker is bundled with the app, so it loads from the same origin and needs no extra CSP source.
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

type PdfViewerProps = {
  /** Download URL of the PDF. The bytes are fetched and drawn here, so the browser never downloads the file. */
  url: string;
  name: string;
};

/** Page-by-page PDF viewer drawn inside the page, so the file is shown instead of being downloaded. */
export function PdfViewer({ url, name }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(containerRef);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<Error | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={`Controls for ${name}`}>
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous page
        </Button>
        <span aria-live="polite">{pageCount > 0 ? `Page ${page} of ${pageCount}` : 'Loading pages...'}</span>
        <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
          Next page
        </Button>
        <Button size="sm" variant="outline" disabled={zoom <= MIN_ZOOM} onClick={() => setZoom(zoom - ZOOM_STEP)}>
          Zoom out
        </Button>
        <Button size="sm" variant="outline" disabled={zoom >= MAX_ZOOM} onClick={() => setZoom(zoom + ZOOM_STEP)}>
          Zoom in
        </Button>
      </div>
      <div ref={containerRef} role="region" aria-label={`PDF ${name}`} className="max-h-[70vh] overflow-auto rounded-md border">
        {error ? (
          <p className="p-3" role="alert">
            Failed to show the PDF: {error.message}
          </p>
        ) : (
          <Document
            file={url}
            loading={<Skeleton className="h-96 w-full" />}
            onLoadSuccess={({ numPages }) => {
              setPageCount(numPages);
              setPage(1);
            }}
            onLoadError={setError}
          >
            <Page pageNumber={page} width={width > 0 ? width * zoom : undefined} renderAnnotationLayer={false} />
          </Document>
        )}
      </div>
    </div>
  );
}
