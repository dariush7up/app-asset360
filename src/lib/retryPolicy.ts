import { statusOf } from './httpError';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 10_000;
const MAX_RETRY_AFTER_MS = 30_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Milliseconds from a `Retry-After` header when the error carries response headers.
 *
 * The CDF SDK's `CogniteError` does not preserve HTTP headers — only `HttpError` (the inner
 * transport error) does. In practice this means `Retry-After` is only honored when the SDK lets
 * the `HttpError` through unmodified (uncommon). The code still checks, so it works when available.
 */
function retryAfterMs(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined;
  const headers = isRecord(error.headers) ? error.headers : undefined;
  if (!headers) return undefined;
  const raw = headers['retry-after'] ?? headers['Retry-After'];
  const seconds = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : Number.NaN;
  return Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds * 1000, MAX_RETRY_AFTER_MS) : undefined;
}

/** Retries network errors, timeouts, 429 and 5xx a bounded number of times; never retries other 4xx. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  const status = statusOf(error);
  if (status === undefined) return true;
  return status === 408 || status === 429 || status >= 500;
}

/** Exponential backoff with jitter; a `Retry-After` header, when present, sets the floor. */
export function retryDelay(attempt: number, error: unknown, random: () => number = Math.random): number {
  const exponential = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
  const jittered = exponential / 2 + (random() * exponential) / 2;
  return Math.max(jittered, retryAfterMs(error) ?? 0);
}
