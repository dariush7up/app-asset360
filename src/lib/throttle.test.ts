import { describe, expect, it } from 'vitest';

import { Throttle } from './throttle';

describe(Throttle.name, () => {
  it('runs up to maxConcurrent tasks in parallel', async () => {
    const throttle = new Throttle(2);
    let running = 0;
    let peakRunning = 0;

    const task = () =>
      throttle.run(async () => {
        running++;
        peakRunning = Math.max(peakRunning, running);
        await new Promise((r) => setTimeout(r, 10));
        running--;
      });

    await Promise.all([task(), task(), task(), task()]);

    expect(peakRunning).toBe(2);
  });

  it('propagates rejections without leaking the slot', async () => {
    const throttle = new Throttle(1);

    await expect(throttle.run(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');

    // The slot is released, so the next task can run.
    const result = await throttle.run(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });

  it('preserves the return value of the wrapped function', async () => {
    const throttle = new Throttle(3);
    const result = await throttle.run(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('rejects construction with maxConcurrent < 1', () => {
    expect(() => new Throttle(0)).toThrow('maxConcurrent must be at least 1');
  });

  it('queues tasks that exceed the concurrency limit and runs them in order', async () => {
    const throttle = new Throttle(1);
    const order: number[] = [];

    const task = (id: number) =>
      throttle.run(async () => {
        order.push(id);
        await new Promise((r) => setTimeout(r, 5));
      });

    await Promise.all([task(1), task(2), task(3)]);

    expect(order).toEqual([1, 2, 3]);
  });
});
