import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from './ErrorBoundary';

describe(ErrorBoundary.name, () => {
  it('renders children when nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('fine')).toBeInTheDocument();
  });

  it('app variant shows the error message and a reload button instead of a blank page', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onReload = vi.fn();
    render(
      <ErrorBoundary onReload={onReload}>
        <Broken control={{ fail: true }} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong: boom');

    await user.click(screen.getByRole('button', { name: 'Reload' }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('panel variant fails in place and recovers on retry', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const control = { fail: true };
    render(
      <div>
        <p>other panel</p>
        <ErrorBoundary variant="panel">
          <Broken control={control} />
        </ErrorBoundary>
      </div>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong: boom');
    expect(screen.getByText('other panel')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument();

    control.fail = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('recovered')).toBeInTheDocument();
  });
});

function Broken({ control }: { control: { fail: boolean } }) {
  if (control.fail) throw new Error('boom');
  return <p>recovered</p>;
}
