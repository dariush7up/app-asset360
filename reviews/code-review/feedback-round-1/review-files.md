# File inventory: Asset 360

All `.ts`/`.tsx` under the app root except `node_modules`, `dist`, `.cognite-bundles` and the skill folders (`.claude`, `.agents`). Tests column: dedicated test file (✓), covered only through the Asset360/App integration tests (~), none (✗).

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| src/main.tsx | 24 | ✓ | ✓ | Bootstrap, QueryClient | n/a | Entry file, exempt |
| src/App.tsx | 90 | ✓ | ✓ | Host connect, providers, ErrorBoundary | ✓ | Fallbacks use raw `bg-muted/50` (lines 22, 39) |
| src/state/appState.ts | 51 | ✓ | ✓ | Host-synced state + parser | ✓ | |
| src/state/appStateContext.ts | 19 | ✓ | ✓ | Context + hook | ~ | |
| src/state/AppStateProvider.tsx | 27 | ✓ | ✓ | Storage layer, syncs to host | ✓ | |
| src/services/AppServices.ts | 21 | ✓ | ✓ | DI context | ~ | |
| src/services/AppServicesProvider.tsx | 26 | ✓ | ✓ | Builds services from `useCogniteSdk()` | ~ | |
| src/cdm/views.ts | 25 | ✓ | ✓ | View constants | ~ | |
| src/cdm/properties.ts | 47 | ✓ | ✓ | Type-guard readers | ✓ | |
| src/cdm/linkedFilter.ts | 10 | ✓ | ✓ | Filter builder | ~ | |
| src/assets/AssetService.ts | 91 | ✓ | ✓ | Interface + class, narrow client | ✓ | |
| src/assets/useAssetSearchViewModel.ts | 37 | ✓ | ✓ | ViewModel, stateless | ~ | No own test |
| src/assets/useAssetViewModel.ts | 61 | ✓ | ✓ | ViewModel, stateless | ~ | No own test |
| src/timeSeries/TimeSeriesService.ts | 130 | ✓ | ✓ | Interface + class | ✓ | Type filter done client-side (line 80) |
| src/timeSeries/useTimeSeriesViewModel.ts | 55 | ✓ | ✓ | ViewModel | ~ | No own test |
| src/files/FileService.ts | 109 | ✓ | ✓ | Interface + class, 3 link routes | ✓ | |
| src/files/useFilesViewModel.ts | 62 | ✓ | ✓ | ViewModel | ~ | No own test |
| src/activities/ActivityService.ts | 66 | ✓ | ✓ | Interface + class | ✓ | |
| src/activities/useActivitiesViewModel.ts | 28 | ✓ | ✓ | ViewModel | ~ | No own test |
| src/asset360/Asset360.tsx | 17 | ✓ | ✓ | Page shell | ✓ | |
| src/asset360/AssetSearch.tsx | 71 | ✓ | ✓ | Type-ahead via Command | ~ | `eslint-disable` for exhaustive-deps at line 22 |
| src/asset360/AssetPage.tsx | 124 | ✓ | ~ | Tabs, breadcrumb | ~ | Duplicate `isAssetTab` (line 25); `children=` data prop (line 113) |
| src/asset360/Section.tsx | 41 | ✓ | ✓ | Loading/error/empty wrapper | ~ | |
| src/asset360/TimeSeriesSection.tsx | 106 | ✓ | ✓ | Aura Chart | ~ | Raw `<p role="alert">` (line 71) |
| src/asset360/FilesSection.tsx | 138 | ✓ | ✓ | DataGrid, viewer | ~ | Raw `<p role="alert">` (line 122) |
| src/asset360/ActivitiesSection.tsx | 57 | ✓ | ✓ | DataGrid | ~ | |
| src/asset360/ChildAssetsSection.tsx | 52 | ✓ | ~ | DataGrid | ~ | Prop named `children` holds data; 50% line coverage |
| src/lib/ErrorBoundary.tsx | 36 | ✓ | ✓ | Class boundary | ✓ | |
| src/lib/useDebouncedValue.ts | 25 | ✓ | ✓ | Injectable scheduler | ✓ | |
| src/lib/queryState.ts | 5 | ✓ | ✓ | Helper | ~ | |
| src/lib/format.ts | 11 | ✓ | ✓ | Helper | ~ | |
| **src/lib/utils.ts** | 6 | ✓ | ✗ | Template `cn()` helper | ✗ | **Unused anywhere in src/** |
| src/__mocks__/instances.ts | 15 | ✓ | ✓ | Mock factory | n/a | |
| src/__mocks__/renderWithApp.tsx | 42 | ✓ | ✓ | Test wrapper | n/a | |
| vite.config.ts | 29 | ✓ | ✓ | | n/a | |
| vitest.config.ts | 17 | ✓ | ~ | | n/a | No `coverage.include` |
| vitest.setup.ts | 13 | ✓ | ✓ | DOM stubs | n/a | |
| 11 `*.test.ts(x)` files | n/a | ✓ | ✓ | Typed `vi.fn`, no `vi.mock` | n/a | Largest: Asset360.test.tsx (227 lines) |
