import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Section } from './Section';

const base = {
  label: 'Documents',
  isLoading: false,
  error: null,
  onRetry: () => undefined,
  isEmpty: false,
  emptyText: 'Nothing here',
};

describe(Section.name, () => {
  it('shows a skeleton while loading instead of the content', () => {
    render(<Section {...base} isLoading>content</Section>);

    expect(screen.getByRole('status', { name: 'Loading documents' })).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows the error with a retry control that runs the request again', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<Section {...base} error={new Error('500 boom')} onRetry={onRetry}>content</Section>);

    expect(screen.getByText('Failed to load documents: 500 boom')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403])('shows a no-access state, not a generic error, for status %i', (status) => {
    render(<Section {...base} error={Object.assign(new Error('Forbidden'), { status })}>content</Section>);

    expect(screen.getByText(/You don't have access to documents/)).toBeInTheDocument();
    expect(screen.queryByText(/Failed to load/)).not.toBeInTheDocument();
  });

  it('shows the empty state text', () => {
    render(<Section {...base} isEmpty>content</Section>);

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('shows the content, with a note only when truncated', () => {
    const { rerender } = render(<Section {...base}>content</Section>);
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.queryByText(/Showing the first/)).not.toBeInTheDocument();

    rerender(<Section {...base} truncated>content</Section>);
    expect(screen.getByText('Showing the first 500 results.')).toBeInTheDocument();
  });
});
