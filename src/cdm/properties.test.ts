import { describe, expect, it } from 'vitest';

import {
  asBoolean,
  asInstanceRef,
  asInstanceRefList,
  asString,
  asText,
  asStringList,
  asTimestamp,
  readProperties,
} from './properties';
import { CDM_VIEWS, instanceKey, propertyPath, viewKey } from './views';

describe('views', () => {
  it('builds the property key and filter path for a view', () => {
    expect(viewKey(CDM_VIEWS.asset)).toBe('CogniteAsset/v1');
    expect(propertyPath(CDM_VIEWS.asset, 'parent')).toEqual(['cdf_cdm', 'CogniteAsset/v1', 'parent']);
    expect(instanceKey({ space: 's', externalId: 'e' })).toBe('s:e');
  });
});

describe(readProperties.name, () => {
  it('returns the properties of the requested view', () => {
    const instance = { properties: { cdf_cdm: { 'CogniteAsset/v1': { name: 'PUMP-101' } } } };

    expect(readProperties(instance, CDM_VIEWS.asset)).toEqual({ name: 'PUMP-101' });
  });

  it('returns an empty object when the view has no data', () => {
    expect(readProperties({}, CDM_VIEWS.asset)).toEqual({});
    expect(readProperties({ properties: { cdf_cdm: {} } }, CDM_VIEWS.asset)).toEqual({});
  });
});

describe('value readers', () => {
  it('reads strings and rejects empty or non-strings', () => {
    expect(asString('a')).toBe('a');
    expect(asString('')).toBeUndefined();
    expect(asString(1)).toBeUndefined();
  });

  it('reads text from strings and numbers', () => {
    expect(asText('Open')).toBe('Open');
    expect(asText(3)).toBe('3');
    expect(asText('')).toBeUndefined();
    expect(asText({})).toBeUndefined();
  });

  it('reads booleans', () => {
    expect(asBoolean(true)).toBe(true);
    expect(asBoolean('true')).toBeUndefined();
  });

  it('parses timestamps to epoch milliseconds', () => {
    expect(asTimestamp('2024-01-01T00:00:00.000+00:00')).toBe(Date.UTC(2024, 0, 1));
    expect(asTimestamp('nope')).toBeUndefined();
    expect(asTimestamp(5)).toBeUndefined();
  });

  it('reads string lists, dropping non-strings', () => {
    expect(asStringList(['a', 1, 'b'])).toEqual(['a', 'b']);
    expect(asStringList(undefined)).toEqual([]);
  });

  it('reads direct relations', () => {
    expect(asInstanceRef({ space: 's', externalId: 'e', extra: 1 })).toEqual({ space: 's', externalId: 'e' });
    expect(asInstanceRef({ space: 's' })).toBeUndefined();
    expect(asInstanceRefList([{ space: 's', externalId: 'e' }, 'x'])).toEqual([{ space: 's', externalId: 'e' }]);
    expect(asInstanceRefList(null)).toEqual([]);
  });
});
