/** Largest number of items a list shows; beyond this the UI says so instead of loading everything. */
export const MAX_LISTED = 500;
/** Items requested per page. */
export const PAGE_SIZE = 100;

export type Listing<T> = {
  items: T[];
  /** True when more items exist than were loaded. */
  truncated: boolean;
};

type Page<T> = { items: T[]; nextCursor?: string };

/** Follows cursors until the data runs out or `maxItems` are loaded, whichever comes first. */
export async function listPages<T>(
  fetchPage: (cursor: string | undefined) => Promise<Page<T>>,
  maxItems: number = MAX_LISTED
): Promise<Listing<T>> {
  const items: T[] = [];
  let cursor: string | undefined;
  do {
    const page = await fetchPage(cursor);
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor && items.length < maxItems);

  return { items: items.slice(0, maxItems), truncated: Boolean(cursor) || items.length > maxItems };
}

type QueryResponse<T> = { items: Record<string, T[]>; nextCursor: Record<string, string> };

/**
 * Follows query cursors for a named result set until the data runs out or `maxItems` are loaded.
 * The `query` callback receives cursors to pass through to `instances.query`.
 */
export async function queryPages<T>(
  resultSet: string,
  query: (cursors: Record<string, string> | undefined) => Promise<QueryResponse<T>>,
  maxItems: number = MAX_LISTED
): Promise<Listing<T>> {
  const items: T[] = [];
  let cursors: Record<string, string> | undefined;
  do {
    const response = await query(cursors);
    const pageItems = response.items[resultSet] ?? [];
    items.push(...pageItems);
    const nextCursor = response.nextCursor[resultSet];
    cursors = nextCursor ? { [resultSet]: nextCursor } : undefined;
  } while (cursors && items.length < maxItems);

  return { items: items.slice(0, maxItems), truncated: Boolean(cursors) || items.length > maxItems };
}

export function emptyListing<T>(): Listing<T> {
  return { items: [], truncated: false };
}
