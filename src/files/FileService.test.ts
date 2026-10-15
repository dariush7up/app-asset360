import type { QueryResponse } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { makeNode } from '../__mocks__/instances';
import { CDM_VIEWS } from '../cdm/views';

import { ApiFileService, fileTypeLabel, isPidCandidate, previewKind, type FileClient, type FileInfo } from './FileService';

const ASSET = { space: 'sp', externalId: 'pump-101' };
const UNIT = { space: 'sp', externalId: 'unit-1' };
const FILE = { space: 'sp', externalId: 'pid.pdf' };

describe(isPidCandidate.name, () => {
  it('accepts files found through a diagram annotation', () => {
    expect(isPidCandidate(file('Layout.png', ['annotation']))).toBe(true);
  });

  it.each(['23-PC-9109 P&ID.pdf', '23-PC-9109_PID_001.pdf', 'Piping drawing.pdf', 'Process Diagram.pdf'])(
    'accepts %s by name',
    (name) => {
      expect(isPidCandidate(file(name, ['direct']))).toBe(true);
    }
  );

  it.each(['Manual.pdf', 'Rapid datasheet.pdf', 'Spider.pdf'])('rejects %s', (name) => {
    expect(isPidCandidate(file(name, ['direct']))).toBe(false);
  });
});

describe(fileTypeLabel.name, () => {
  it.each([
    ['application/pdf', 'PDF'],
    ['image/png', 'PNG'],
    ['image/jpeg', 'JPEG'],
    ['application/vnd.ms-excel', 'MS-EXCEL'],
    ['text/plain; charset=utf-8', 'PLAIN'],
    [undefined, ''],
    ['unknown', ''],
  ])('labels %s as %s', (mimeType, label) => {
    expect(fileTypeLabel(mimeType)).toBe(label);
  });
});

describe(previewKind.name, () => {
  it.each([
    ['application/pdf', 'pdf'],
    ['Application/PDF; charset=binary', 'pdf'],
    ['image/png', 'image'],
    ['image/jpeg', 'image'],
    ['image/gif', 'image'],
    ['image/webp', 'image'],
  ])('previews %s inline as %s', (mimeType, kind) => {
    expect(previewKind(mimeType)).toBe(kind);
  });

  it.each(['image/tiff', 'image/svg+xml', 'application/msword', 'video/mp4', 'application/acad', undefined])(
    'offers download or open-externally for %s',
    (mimeType) => {
      expect(previewKind(mimeType)).toBe('none');
    }
  );
});

describe(ApiFileService.name, () => {
  it('lists files linked directly to the asset', async () => {
    const query = vi.fn<FileClient['instances']['query']>(() =>
      Promise.resolve(queryResult('files', [makeNode(FILE, CDM_VIEWS.file, { name: 'P&ID', mimeType: 'application/pdf', isUploaded: true })]))
    );
    const service = new ApiFileService(makeClient({ query }));

    const files = await service.listForAsset(ASSET, []);

    expect(files.items).toEqual([
      { ref: FILE, name: 'P&ID', mimeType: 'application/pdf', isUploaded: true, links: ['direct'], lastModified: 0 },
    ]);
  });

  it('reports the last modified date: source update, else upload time, else node update', async () => {
    const query = vi.fn<FileClient['instances']['query']>(() =>
      Promise.resolve(
        queryResult('files', [
          makeNode({ space: 'sp', externalId: 'a' }, CDM_VIEWS.file, { sourceUpdatedTime: '2024-02-01T00:00:00Z', uploadedTime: '2024-01-01T00:00:00Z' }),
          makeNode({ space: 'sp', externalId: 'b' }, CDM_VIEWS.file, { uploadedTime: '2024-01-01T00:00:00Z' }),
          makeNode({ space: 'sp', externalId: 'c' }, CDM_VIEWS.file, {}),
        ])
      )
    );
    const service = new ApiFileService(makeClient({ query }));

    const files = await service.listForAsset(ASSET, []);

    expect(files.items.map((f) => f.lastModified)).toEqual([Date.UTC(2024, 1, 1), Date.UTC(2024, 0, 1), 0]);
  });

  it('treats a missing isUploaded as not uploaded', async () => {
    const query = vi.fn<FileClient['instances']['query']>(() => Promise.resolve(queryResult('files', [makeNode(FILE, CDM_VIEWS.file, {})])));
    const service = new ApiFileService(makeClient({ query }));

    const {
      items: [file],
    } = await service.listForAsset(ASSET, []);

    expect(file).toMatchObject({ name: 'pid.pdf', isUploaded: false });
  });

  it('includes files linked to ancestors and marks them as such', async () => {
    const query = vi.fn<FileClient['instances']['query']>((params) => {
      // The ancestor-linked query includes the ancestor ref in its filter.
      const payload = JSON.stringify(params);
      if (payload.includes('unit-1')) {
        return Promise.resolve(queryResult('files', [makeNode(FILE, CDM_VIEWS.file, { name: 'Unit P&ID' })]));
      }
      return Promise.resolve(queryResult('files', []));
    });
    const service = new ApiFileService(makeClient({ query }));

    const files = await service.listForAsset(ASSET, [UNIT]);

    expect(files.items.map((f) => [f.name, f.links])).toEqual([['Unit P&ID', ['ancestor']]]);
  });

  it('finds files through the annotation query that traverses edges to their start nodes', async () => {
    const query = vi.fn<FileClient['instances']['query']>((params) => {
      // The annotation query uses the 'annotatedFiles' result set with an edge traversal.
      if ('annotatedFiles' in params.with) {
        return Promise.resolve(queryResult('annotatedFiles', [makeNode(FILE, CDM_VIEWS.file, { name: 'Unit P&ID' })]));
      }
      // Direct file queries return empty.
      return Promise.resolve(queryResult('files', []));
    });
    const service = new ApiFileService(makeClient({ query }));

    const files = await service.listForAsset(ASSET, []);

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        with: expect.objectContaining({
          annotations: expect.objectContaining({
            edges: expect.objectContaining({
              filter: { equals: { property: ['edge', 'endNode'], value: ASSET } },
            }),
          }),
          annotatedFiles: expect.objectContaining({
            nodes: expect.objectContaining({ from: 'annotations' }),
          }),
        }),
      })
    );
    expect(files.items.map((f) => [f.name, f.links])).toEqual([['Unit P&ID', ['annotation']]]);
  });

  it('merges the ways a single file is linked', async () => {
    const query = vi.fn<FileClient['instances']['query']>((params) => {
      if ('annotatedFiles' in params.with) {
        return Promise.resolve(queryResult('annotatedFiles', [makeNode(FILE, CDM_VIEWS.file, { name: 'P&ID' })]));
      }
      return Promise.resolve(queryResult('files', [makeNode(FILE, CDM_VIEWS.file, { name: 'P&ID' })]));
    });
    const service = new ApiFileService(makeClient({ query }));

    const files = await service.listForAsset(ASSET, []);

    expect(files.items).toHaveLength(1);
    expect(files.items[0].links).toEqual(['direct', 'annotation']);
  });

  it('returns empty when no files are found through any route', async () => {
    const query = vi.fn<FileClient['instances']['query']>((params) => {
      if ('annotatedFiles' in params.with) return Promise.resolve(queryResult('annotatedFiles', []));
      return Promise.resolve(queryResult('files', []));
    });
    const service = new ApiFileService(makeClient({ query }));

    expect(await service.listForAsset(ASSET, [])).toEqual({ items: [], truncated: false });
  });

  it('flags truncation when any route has more results than were loaded', async () => {
    const query = vi.fn<FileClient['instances']['query']>((params) => {
      if ('annotatedFiles' in params.with) {
        return Promise.resolve(queryResult('annotatedFiles', [makeNode(FILE, CDM_VIEWS.file, { name: 'P&ID' })], 'more'));
      }
      return Promise.resolve(queryResult('files', []));
    });
    const service = new ApiFileService(makeClient({ query }));

    const files = await service.listForAsset(ASSET, []);

    expect(files.truncated).toBe(true);
  });

  it('propagates API errors', async () => {
    const query = vi.fn<FileClient['instances']['query']>(() => Promise.reject(new Error('403')));
    const service = new ApiFileService(makeClient({ query }));

    await expect(service.listForAsset(ASSET, [])).rejects.toThrow('403');
  });

  it('requests a download link by instance id', async () => {
    const getDownloadUrls = vi.fn<FileClient['files']['getDownloadUrls']>(() =>
      Promise.resolve([{ instanceId: FILE, downloadUrl: 'https://download.test/pid' }])
    );
    const service = new ApiFileService(makeClient({}, { getDownloadUrls }));

    const url = await service.downloadUrl(FILE);

    expect(getDownloadUrls).toHaveBeenCalledWith([{ instanceId: FILE }]);
    expect(url).toBe('https://download.test/pid');
  });

  it('throws when no download link is returned', async () => {
    const getDownloadUrls = vi.fn<FileClient['files']['getDownloadUrls']>(() => Promise.resolve([]));
    const service = new ApiFileService(makeClient({}, { getDownloadUrls }));

    await expect(service.downloadUrl(FILE)).rejects.toThrow('No download link');
  });
});

function makeClient(instances: Partial<FileClient['instances']> = {}, files: Partial<FileClient['files']> = {}): FileClient {
  const fail = () => Promise.reject(new Error('unexpected call'));
  return {
    instances: { query: fail, ...instances },
    files: { getDownloadUrls: fail, ...files },
  };
}

function queryResult(resultSet: string, items: unknown[], nextCursor?: string): QueryResponse {
  return {
    items: { [resultSet]: items },
    nextCursor: nextCursor ? { [resultSet]: nextCursor } : {},
  } as QueryResponse;
}

function file(name: string, links: FileInfo['links']): FileInfo {
  return { ref: FILE, name, isUploaded: true, links };
}
