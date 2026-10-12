import type { CogniteClient } from '@cognite/sdk';

import { linkedToAssetFilter } from '../cdm/linkedFilter';
import { emptyListing, PAGE_SIZE, queryPages, type Listing } from '../cdm/paging';
import { asBoolean, asString, asTimestamp, readProperties } from '../cdm/properties';
import { allPropertiesFrom, CDM_VIEWS, instanceKey, type InstanceRef } from '../cdm/views';

/** How a file relates to the asset: set on the file itself, via a diagram annotation, or via a parent asset. */
export type FileLink = 'direct' | 'annotation' | 'ancestor';

export type FileInfo = {
  ref: InstanceRef;
  name: string;
  mimeType?: string;
  isUploaded: boolean;
  links: FileLink[];
  /** Last modified in the source system, else when the file was uploaded, else when the node last changed. */
  lastModified?: number;
};

export type PreviewKind = 'pdf' | 'image' | 'none';

const PREVIEW_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/** Which inline viewer a file gets: PDFs and common images only; everything else is download or open externally. */
export function previewKind(mimeType: string | undefined): PreviewKind {
  const type = mimeType?.toLowerCase().split(';')[0].trim();
  if (type === 'application/pdf') return 'pdf';
  return type !== undefined && PREVIEW_IMAGE_TYPES.includes(type) ? 'image' : 'none';
}


/** Short label for the file type, such as `PDF` or `PNG`; empty when the type is unknown. */
export function fileTypeLabel(mimeType: string | undefined): string {
  const subtype = mimeType?.toLowerCase().split(';')[0].split('/')[1];
  if (!subtype) return '';
  if (subtype.includes('.') || subtype.includes('+')) return subtype.split(/[.+]/).pop()?.toUpperCase() ?? '';
  return subtype === 'jpeg' ? 'JPEG' : subtype.toUpperCase();
}

const DIAGRAM_NAME = /(^|[^a-z])(p\s*&\s*id|pid)([^a-z]|$)|piping|diagram/i;

/** A file that is probably a P&ID: found through a diagram annotation, or named like a diagram. */
export function isPidCandidate(file: FileInfo): boolean {
  return file.links.includes('annotation') || DIAGRAM_NAME.test(file.name);
}

export interface FileService {
  /** Files for the asset, found through its own `assets` links, diagram annotations and its ancestors' links. */
  listForAsset(asset: InstanceRef, ancestors: InstanceRef[]): Promise<Listing<FileInfo>>;
  /** Temporary download URL; short-lived, so request it when the user opens the file. */
  downloadUrl(file: InstanceRef): Promise<string>;
}

/** Narrow slice of CogniteClient that this service depends on. */
export interface FileClient {
  instances: Pick<CogniteClient['instances'], 'query'>;
  files: Pick<CogniteClient['files'], 'getDownloadUrls'>;
}

export class ApiFileService implements FileService {
  constructor(private readonly client: FileClient) {}

  async listForAsset(asset: InstanceRef, ancestors: InstanceRef[]): Promise<Listing<FileInfo>> {
    const [direct, annotated, inherited] = await Promise.all([
      this.listLinked([asset]),
      this.listAnnotated(asset),
      ancestors.length > 0 ? this.listLinked(ancestors) : Promise.resolve(emptyListing<FileInfo>()),
    ]);

    const merged = new Map<string, FileInfo>();
    const add = (files: FileInfo[], link: FileLink) => {
      for (const file of files) {
        const key = instanceKey(file.ref);
        const existing = merged.get(key);
        if (existing) existing.links.push(link);
        else merged.set(key, { ...file, links: [link] });
      }
    };
    add(direct.items, 'direct');
    add(annotated.items, 'annotation');
    add(inherited.items, 'ancestor');
    return { items: [...merged.values()], truncated: direct.truncated || annotated.truncated || inherited.truncated };
  }

  async downloadUrl(file: InstanceRef): Promise<string> {
    const [link] = await this.client.files.getDownloadUrls([{ instanceId: file }]);
    if (!link) throw new Error('No download link returned for the file');
    return link.downloadUrl;
  }

  /** Files whose `assets` list contains any of the given assets. */
  private async listLinked(assets: InstanceRef[]): Promise<Listing<FileInfo>> {
    const RESULT = 'files';
    const { items, truncated } = await queryPages(RESULT, (cursors) =>
      this.client.instances.query({
        with: {
          [RESULT]: {
            nodes: { filter: linkedToAssetFilter(CDM_VIEWS.file, assets) },
            limit: PAGE_SIZE,
          },
        },
        select: { [RESULT]: { sources: allPropertiesFrom(CDM_VIEWS.file) } },
        cursors,
      })
    );
    return { items: items.map(toFileInfo), truncated };
  }

  /**
   * Files with a diagram annotation (an edge from the file) pointing at the asset, such as P&ID tag matches.
   * Uses a single query call: edges ending at the asset → their start nodes filtered to files.
   */
  private async listAnnotated(asset: InstanceRef): Promise<Listing<FileInfo>> {
    const EDGES = 'annotations';
    const FILES = 'annotatedFiles';
    const { items, truncated } = await queryPages(FILES, (cursors) =>
      this.client.instances.query({
        with: {
          [EDGES]: {
            edges: { filter: { equals: { property: ['edge', 'endNode'], value: asset } } },
            limit: PAGE_SIZE,
          },
          [FILES]: {
            nodes: {
              from: EDGES,
              // Edges ending at the asset: follow back to the start node (the file).
              // hasData filters out non-file nodes that happen to be start nodes of matching edges.
              filter: { hasData: [CDM_VIEWS.file] },
            },
            limit: PAGE_SIZE,
          },
        },
        select: { [FILES]: { sources: allPropertiesFrom(CDM_VIEWS.file) } },
        cursors,
      })
    );
    return { items: items.map(toFileInfo), truncated };
  }
}

function toFileInfo(node: Parameters<typeof readProperties>[0] & InstanceRef & { lastUpdatedTime?: number }): FileInfo {
  const props = readProperties(node, CDM_VIEWS.file);
  return {
    ref: { space: node.space, externalId: node.externalId },
    name: asString(props.name) ?? node.externalId,
    mimeType: asString(props.mimeType),
    isUploaded: asBoolean(props.isUploaded) ?? false,
    links: [],
    lastModified: asTimestamp(props.sourceUpdatedTime) ?? asTimestamp(props.uploadedTime) ?? node.lastUpdatedTime,
  };
}
