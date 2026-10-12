import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PdfViewer } from './PdfViewer';

// pdf.js needs a real canvas and worker, which happy-dom does not provide, so react-pdf is replaced by a
// small fake that reports a 3-page document and shows the page number it was asked to draw.
vi.mock('react-pdf', () => ({
  pdfjs: { GlobalWorkerOptions: {} },
  Document: ({
    file,
    children,
    onLoadSuccess,
    onLoadError,
  }: {
    file: string;
    children: ReactNode;
    onLoadSuccess: (pdf: { numPages: number }) => void;
    onLoadError: (error: Error) => void;
  }) => (
    <div data-testid="document" data-file={file}>
      <button onClick={() => onLoadSuccess({ numPages: 3 })}>finish loading</button>
      <button onClick={() => onLoadError(new Error('Invalid PDF structure'))}>fail loading</button>
      {children}
    </div>
  ),
  Page: ({ pageNumber, width }: { pageNumber: number; width?: number }) => (
    <div data-testid="page" data-width={width ?? ''}>{`Drawn page ${pageNumber}`}</div>
  ),
}));

describe(PdfViewer.name, () => {
  it('draws the PDF from its download URL inside the page', () => {
    render(<PdfViewer url="https://download.test/pid" name="P&ID.pdf" />);

    expect(screen.getByTestId('document')).toHaveAttribute('data-file', 'https://download.test/pid');
    expect(screen.getByText('Drawn page 1')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'PDF P&ID.pdf' })).toBeInTheDocument();
  });

  it('pages through the document once it has loaded', async () => {
    const user = userEvent.setup();
    render(<PdfViewer url="u" name="a.pdf" />);
    expect(screen.getByText('Loading pages...')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'finish loading' }));

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Drawn page 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('zooms in and out within limits', async () => {
    const user = userEvent.setup();
    render(<PdfViewer url="u" name="a.pdf" />);

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByTestId('page')).toHaveAttribute('data-width', '1000');

    for (let i = 0; i < 10; i++) await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
  });

  it('shows an error message when the PDF cannot be read', async () => {
    const user = userEvent.setup();
    render(<PdfViewer url="u" name="a.pdf" />);

    await user.click(screen.getByRole('button', { name: 'fail loading' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to show the PDF: Invalid PDF structure');
  });
});
