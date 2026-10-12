import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useAppState } from './appStateContext';
import { AppStateProvider } from './AppStateProvider';

describe(AppStateProvider.name, () => {
  it('seeds state from the initial state string', () => {
    const { result } = setup(JSON.stringify({ query: 'pump', range: '1h' }));

    expect(result.current.state).toMatchObject({ query: 'pump', range: '1h' });
  });

  it('applies updates and syncs them to the host', () => {
    const syncInternalState = vi.fn(() => Promise.resolve(true));
    const { result } = setup(undefined, syncInternalState);

    act(() => result.current.update({ query: 'tank' }));

    expect(result.current.state.query).toBe('tank');
    expect(syncInternalState).toHaveBeenCalledWith(expect.stringContaining('"query":"tank"'));
  });

  it('opens external URLs in a new tab through the host', () => {
    const navigateExternal = vi.fn(() => Promise.resolve(true));
    const { result } = setup(undefined, undefined, navigateExternal);

    act(() => result.current.openExternal('https://download.test/file'));

    expect(navigateExternal).toHaveBeenCalledWith({ url: 'https://download.test/file', openInNewTab: true });
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useAppState())).toThrow('AppStateProvider');
  });
});

function setup(
  initialState?: string,
  syncInternalState = vi.fn(() => Promise.resolve(true)),
  navigateExternal = vi.fn(() => Promise.resolve(true))
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppStateProvider api={{ syncInternalState, navigateExternal }} initialState={initialState}>
      {children}
    </AppStateProvider>
  );
  return renderHook(() => useAppState(), { wrapper });
}
