# File inventory: Asset 360 (round 3)

All `.ts`/`.tsx` under the app root except `node_modules`, `dist`, `.cognite-bundles` and the skill folders (`.claude`, `.agents`). 45 production files and 29 test files. Tests column: dedicated test file (✓), covered through the Asset360/App integration tests (~), none (✗). Every non-trivial production file was read.

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| src/main.tsx | 24 | ✓ | ✓ | Bootstrap, QueryClient with retry policy | n/a | Entry file, exempt |
| src/App.tsx | 94 | ✓ | ✓ | Host connect, providers, app ErrorBoundary | ✓ | Fallbacks use raw `bg-muted/50` (lines 23, 40) |
| src/state/appState.ts | 40 | ✓ | ✓ | Host-synced state + parser | ✓ | |
| src/state/appStateContext.ts | 21 | ✓ | ✓ | Context + hook | ~ | |
| src/state/AppStateProvider.tsx | 31 | ✓ | ~ | Storage layer, syncs to host | ✓ | `update` closes over `state` (line 14) |
| src/services/AppServices.ts | 20 | ✓ | ✓ | DI context | ✓ | |
| src/services/AppServicesProvider.tsx | 26 | ✓ | ✓ | Builds services from `useCogniteSdk()` | ~ | |
| src/recent/RecentAssets.ts | 90 | ✓ | ✓ | Interface + localStorage class, injected storage | ✓ | |
| src/recent/recentAssetsContext.ts, RecentAssetsProvider.tsx | 12, 9 | ✓ | ✓ | DI context | ~ | |
| src/recent/useRecentAssetsViewModel.ts | 25 | ✓ | ✓ | ViewModel | ✓ | |
| src/cdm/views.ts, properties.ts, linkedFilter.ts, paging.ts | 30-60 | ✓ | ✓ | Pure helpers | ✓ | |
| src/assets/AssetService.ts | 115 | ✓ | ✓ | Interface + class | ✓ | Search adds a parent lookup; retrieve adds type/class lookup |
| src/assets/useAssetSearchViewModel.ts, useAssetViewModel.ts | 30, 50 | ✓ | ✓ | ViewModels | ✓ | |
| src/timeSeries/TimeSeriesService.ts | 190 | ✓ | ✓ | Interface + class, latest-datapoint anchoring | ✓ | |
| src/timeSeries/useTimeSeriesViewModel.ts, chartRows.ts | 75, 25 | ✓ | ✓ | ViewModel, pure merge | ✓ | |
| src/files/FileService.ts | 150 | ✓ | ✓ | Interface + class, 3 link routes, preview rules | ✓ | |
| src/files/useFilesViewModel.ts | 50 | ✓ | ✓ | ViewModel | ✓ | |
| src/workOrders/WorkOrderService.ts | 95 | ✓ | ✓ | Interface + class | ✓ | |
| src/workOrders/useWorkOrdersViewModel.ts | 40 | ✓ | ✓ | ViewModel | ✓ | |
| src/asset360/Asset360.tsx | 25 | ✓ | ✓ | Home or asset page | ~ | |
| src/asset360/AssetSearch.tsx | 97 | ✓ | ✓ | Command type-ahead | ~ | `eslint-disable` for exhaustive-deps (line 24, justified) |
| src/asset360/RecentAssets.tsx | 25 | ✓ | ✓ | Recently viewed list | ~ | |
| src/asset360/AssetPage.tsx | 113 | ✓ | ✓ | Header + three panels | ~ | Error and no-access branches at 83% coverage |
| src/asset360/Panel.tsx, Section.tsx | 20, 55 | ✓ | ✓ | Panel boundary; loading/error/no-access/empty | ✓ | |
| src/asset360/TimeSeriesPanel.tsx, TimeSeriesChart.tsx | 103, 55 | ✓ | ✓ | Multi-select, Aura Chart | ~ | |
| src/asset360/WorkOrdersPanel.tsx, WorkOrderDetail.tsx | 70, 55 | ✓ | ✓ | DataGrid, Dialog | ~ | |
| src/asset360/DocumentsPanel.tsx, FileViewer.tsx | 93, 40 | ✓ | ~ | DataGrid, preview | ~ | Raw `<p>` error text (FileViewer.tsx:35) |
| src/asset360/PdfViewer.tsx | 65 | ✓ | ✓ | react-pdf, worker bundled | ✓ | Mocked in tests; raw `role="alert"` paragraph (line 49) |
| src/lib/ErrorBoundary.tsx | 45 | ✓ | ✓ | App and panel variants | ✓ | |
| src/lib/retryPolicy.ts, httpError.ts | 35, 15 | ✓ | ✓ | Pure helpers | ✓ | |
| src/lib/useDebouncedValue.ts, useElementWidth.ts | 25, 20 | ✓ | ✓ | Hooks, cleanup on unmount | ✓ | |
| src/lib/queryState.ts, format.ts | 15, 12 | ✓ | ✓ | Helpers | ✓ | |
| src/__mocks__/instances.ts, renderWithApp.tsx | 15, 60 | ✓ | ✓ | Typed factories | n/a | |
| vite.config.ts, vitest.config.ts, vitest.setup.ts | 30, 28, 14 | ✓ | ✓ | | n/a | `coverage.include` is now `src/**` |
| 29 `*.test.ts(x)` files | n/a | ✓ | ✓ | Typed `vi.fn`; two commented `vi.mock` | n/a | Largest: Asset360.test.tsx |
