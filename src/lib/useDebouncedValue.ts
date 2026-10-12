import { useEffect, useState } from 'react';

type TimerHandle = ReturnType<typeof setTimeout>;

type Scheduler = {
  setTimeout: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimeout: (handle: TimerHandle) => void;
};

const browserScheduler: Scheduler = {
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle),
};

/** Returns `value` once it has stopped changing for `delayMs`. The scheduler is injectable for tests. */
export function useDebouncedValue<T>(value: T, delayMs: number, scheduler: Scheduler = browserScheduler): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = scheduler.setTimeout(() => setDebounced(value), delayMs);
    return () => scheduler.clearTimeout(handle);
  }, [value, delayMs, scheduler]);

  return debounced;
}
