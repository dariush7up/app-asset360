import type { InstanceRef, ViewRef } from './views';
import { viewKey } from './views';

type InstanceLike = { properties?: Record<string, Record<string, unknown>> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Properties of one view on an instance, or an empty object when the instance has no data in that view. */
export function readProperties(instance: InstanceLike, view: ViewRef): Record<string, unknown> {
  const group = instance.properties?.[view.space]?.[viewKey(view)];
  return isRecord(group) ? group : {};
}

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** A string, or a number shown as text; empty strings count as missing. */
export function asText(value: unknown): string | undefined {
  if (typeof value === 'number') return String(value);
  return asString(value);
}

export function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

/** Timestamps arrive as ISO strings; returns epoch milliseconds. */
export function asTimestamp(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

export function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function asInstanceRef(value: unknown): InstanceRef | undefined {
  if (!isRecord(value)) return undefined;
  const { space, externalId } = value;
  return typeof space === 'string' && typeof externalId === 'string' ? { space, externalId } : undefined;
}

export function asInstanceRefList(value: unknown): InstanceRef[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const ref = asInstanceRef(item);
    return ref ? [ref] : [];
  });
}
