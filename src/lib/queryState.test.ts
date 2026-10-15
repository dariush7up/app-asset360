import { describe, expect, it, vi } from 'vitest';

import { queryState } from './queryState';

describe(queryState.name, () => {
  it('passes the loading flag through and has no error', () => {
    const state = queryState({ isLoading: true, error: null, refetch: vi.fn() });

    expect(state).toMatchObject({ isLoading: true, error: null });
  });

  it('exposes the error', () => {
    const error = new Error('boom');

    expect(queryState({ isLoading: false, error, refetch: vi.fn() }).error).toBe(error);
  });

  it('retries by refetching the query', () => {
    const refetch = vi.fn(() => Promise.resolve());

    queryState({ isLoading: false, error: new Error('x'), refetch }).retry();

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
