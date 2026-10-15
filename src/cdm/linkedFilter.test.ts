import { describe, expect, it } from 'vitest';

import { linkedToAssetFilter } from './linkedFilter';
import { CDM_VIEWS } from './views';

const PUMP = { space: 'sp', externalId: 'pump' };
const UNIT = { space: 'sp', externalId: 'unit' };

describe(linkedToAssetFilter.name, () => {
  it('requires data in the view and a link to the asset', () => {
    expect(linkedToAssetFilter(CDM_VIEWS.file, PUMP)).toEqual({
      and: [
        { hasData: [CDM_VIEWS.file] },
        { containsAny: { property: ['cdf_cdm', 'CogniteFile/v1', 'assets'], values: [PUMP] } },
      ],
    });
  });

  it('accepts several assets and matches any of them', () => {
    expect(linkedToAssetFilter(CDM_VIEWS.file, [PUMP, UNIT])).toMatchObject({
      and: [expect.anything(), { containsAny: { values: [PUMP, UNIT] } }],
    });
  });
});
