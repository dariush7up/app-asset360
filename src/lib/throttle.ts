/** Limits the number of concurrent async operations to avoid overwhelming CDF with parallel requests. */
export class Throttle {
  private running = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(private readonly maxConcurrent: number) {
    if (maxConcurrent < 1) throw new Error('maxConcurrent must be at least 1');
  }

  /** Run `fn` once a slot is available; resolves or rejects with fn's result. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => this.waiting.push(resolve));
  }

  private release(): void {
    const next = this.waiting.shift();
    if (next) {
      // Hand the slot to the next waiter — `running` stays the same.
      next();
    } else {
      this.running--;
    }
  }
}
