function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** HTTP status carried by a CDF SDK error, if any. */
export function statusOf(error: unknown): number | undefined {
  return isRecord(error) && typeof error.status === 'number' ? error.status : undefined;
}

/** The analyst's token lacks the capability for this data (HTTP 401 or 403). */
export function isForbidden(error: unknown): boolean {
  const status = statusOf(error);
  return status === 401 || status === 403;
}
