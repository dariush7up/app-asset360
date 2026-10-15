import { describe, expect, it, vi } from 'vitest';

import { listPages, queryPages } from './paging';

describe(listPages.name, () => {
  it('returns a single page without a cursor as complete', async () => {
    const fetchPage = vi.fn(() => Promise.resolve({ items: [1, 2] }));

    const result = await listPages(fetchPage);

    expect(result).toEqual({ items: [1, 2], truncated: false });
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('follows cursors until the data runs out', async () => {
    const fetchPage = vi
      .fn<(cursor: string | undefined) => Promise<{ items: number[]; nextCursor?: string }>>()
      .mockResolvedValueOnce({ items: [1, 2], nextCursor: 'a' })
      .mockResolvedValueOnce({ items: [3] });

    const result = await listPages(fetchPage);

    expect(result).toEqual({ items: [1, 2, 3], truncated: false });
    expect(fetchPage).toHaveBeenNthCalledWith(2, 'a');
  });

  it('stops at the item cap and reports truncation', async () => {
    const fetchPage = vi.fn((cursor: string | undefined) =>
      Promise.resolve({ items: [1, 2, 3], nextCursor: `${cursor ?? ''}x` })
    );

    const result = await listPages(fetchPage, 5);

    expect(result.items).toEqual([1, 2, 3, 1, 2]);
    expect(result.truncated).toBe(true);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('is not truncated when the last page ends exactly at the cap', async () => {
    const fetchPage = vi.fn(() => Promise.resolve({ items: [1, 2, 3] }));

    expect(await listPages(fetchPage, 3)).toEqual({ items: [1, 2, 3], truncated: false });
  });

  it('propagates errors', async () => {
    await expect(listPages(() => Promise.reject(new Error('403')))).rejects.toThrow('403');
  });
});

describe(queryPages.name, () => {
  it('returns items from the named result set', async () => {
    const query = vi.fn(() => Promise.resolve({ items: { nodes: [1, 2] }, nextCursor: {} }));

    const result = await queryPages('nodes', query);

    expect(result).toEqual({ items: [1, 2], truncated: false });
    expect(query).toHaveBeenCalledWith(undefined);
  });

  it('follows cursors for the result set', async () => {
    const query = vi
      .fn<(cursors: Record<string, string> | undefined) => Promise<{ items: Record<string, number[]>; nextCursor: Record<string, string> }>>()
      .mockResolvedValueOnce({ items: { nodes: [1, 2] }, nextCursor: { nodes: 'c1' } })
      .mockResolvedValueOnce({ items: { nodes: [3] }, nextCursor: {} });

    const result = await queryPages('nodes', query);

    expect(result).toEqual({ items: [1, 2, 3], truncated: false });
    expect(query).toHaveBeenNthCalledWith(2, { nodes: 'c1' });
  });

  it('stops at the item cap and reports truncation', async () => {
    const query = vi.fn(() => Promise.resolve({ items: { nodes: [1, 2, 3] }, nextCursor: { nodes: 'more' } }));

    const result = await queryPages('nodes', query, 5);

    expect(result.items).toEqual([1, 2, 3, 1, 2]);
    expect(result.truncated).toBe(true);
  });

  it('returns an empty list when the result set is missing', async () => {
    const query = vi.fn(() => Promise.resolve({ items: {}, nextCursor: {} }));

    const result = await queryPages('nodes', query);

    expect(result).toEqual({ items: [], truncated: false });
  });

  it('propagates errors', async () => {
    await expect(queryPages('nodes', () => Promise.reject(new Error('403')))).rejects.toThrow('403');
  });
});
