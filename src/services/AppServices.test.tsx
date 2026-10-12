import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeServices } from '../__mocks__/renderWithApp';

import { AppServicesContext, useAppServices } from './AppServices';

describe(useAppServices.name, () => {
  it('returns the injected services', () => {
    const services = makeServices();

    const { result } = renderHook(() => useAppServices(), {
      wrapper: ({ children }) => <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>,
    });

    expect(result.current).toBe(services);
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useAppServices())).toThrow('AppServicesProvider');
  });
});
