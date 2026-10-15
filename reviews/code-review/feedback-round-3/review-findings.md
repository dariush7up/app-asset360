# Findings: Asset 360 (round 3)

## Config inspected
- Coverage config file(s): `vitest.config.ts` (v8 provider; `vite.config.ts` has no `test` block)
- Production paths excluded from coverage: none. `coverage.include` is `src/**/*.{ts,tsx}`; excludes are `node_modules/`, `dist/`, `.claude/`, `.agents/`, `vitest.setup.ts`, `**/*.config.ts`, `**/*.d.ts`, tests, `src/__mocks__/**`, `src/main.tsx`.
- Tests excluded from the test run: `.claude/**`, `.agents/**` (agent skill folders, not app tests), plus vitest defaults.

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | App-level: src/App.tsx:80. Per panel: src/asset360/Panel.tsx:14 (time series, work orders, documents) |
| TODO/FIXME | none |
| useEffect cleanup | App.tsx (cancel flag), useDebouncedValue.ts (clears timer), useElementWidth.ts (disconnects observer), AssetPage-related useAssetViewModel.ts (records recent asset, no async work), AssetSearch.tsx (no async/timer; `eslint-disable` justified at line 24) |
| loading/error/empty | Section.tsx covers loading, error with retry, no-access (401/403) and empty for every panel; AssetPage.tsx covers loading, not-found, error, no-access; AssetSearch.tsx covers all four |
| coverage/test exclude | see Config inspected |
| CDF Raw | none |
| instances.list/query/search | search: AssetService.ts:58. list: TimeSeriesService.ts:91, FileService.ts:95 and :109 (edges), WorkOrderService.ts:58. retrieve: AssetService.ts:75 and :98, FileService.ts:124. No `query`/`aggregate`. Datapoints: TimeSeriesService.ts:125, :171. Download links: FileService.ts:87 |
| QueuedTaskRunner / 429 | no runner. Backoff: src/lib/retryPolicy.ts (429, 408, 5xx, 3 retries, jitter, `Retry-After` when the error carries headers), wired at src/main.tsx:14 |
| any / vi.mock | `any`: none in production (one false hit in a test title). `vi.mock`: PdfViewer.test.tsx:10 and Asset360.test.tsx:56, both with an explaining comment |
| `as` casts (production) | none |
| createContext/useContext | appStateContext.ts, AppServices.ts, recentAssetsContext.ts, AppServicesProvider.tsx |
| hooks relative imports | no `src/hooks/` directory |
| CogniteClient | only in tests (`src/App.test.tsx`); none in production |
| service classes | ApiAssetService, ApiTimeSeriesService, ApiFileService, ApiWorkOrderService, LocalStorageRecentAssets, each `implements` an interface |
| pages with SDK/query | no `src/pages` or `src/views`; components call ViewModels only |
| ViewModels | useAssetSearchViewModel, useAssetViewModel, useTimeSeriesViewModel, useFilesViewModel, useWorkOrdersViewModel, useRecentAssetsViewModel |
| browser storage | src/recent/RecentAssetsProvider.tsx:8 (`window.localStorage`, injected into the store; errors are caught) |
| console.log/debug | none (`console.error` in ErrorBoundary only) |
| routes | none (single view, state host-synced) |
| lint / tsc | `npm run lint` clean; `tsc --noEmit` exit 0 |
| unused files | none |
| components > 150 lines | none (largest: AssetPage.tsx 113 lines) |

Coverage (Vitest 4.1.10, 29 files, 198 tests, all pass), full `src/` scope, as configured: 97.8% statements, 89.42% branches, 97.34% functions, **99.14% lines** (≥ 80%). Lowest: AssetPage.tsx 83.3% lines (error, no-access and retry branches), WorkOrderDetail.tsx 80%, TimeSeriesChart.tsx 87.5%.

## Must / should / nice
- [ ] MUST: `react-pdf` is 2 majors behind (9.2.1 vs 11.0.0) in `dependencies` with no documented upgrade plan; 10.x supports React 18 and 11 needs React 19, which Aura and the app SDK do not allow yet — package.json:35, docs/dependency-upgrade-plan.md — 1.3
- [ ] SHOULD: Four filtered `instances.list` reads for read-heavy panels that could use `instances.query` — TimeSeriesService.ts:91, FileService.ts:95 and :109, WorkOrderService.ts:58 — 2.1
- [ ] SHOULD: No concurrency cap or runner. An asset page starts about a dozen CDF requests at once, and the retry policy cannot honor `Retry-After` unless the SDK error carries headers — src/main.tsx:14, retryPolicy.ts:12 — 2.5
- [ ] SHOULD: Production dependencies one major behind, blocked by Aura's peer ranges (react and react-dom 19, @cognite/aura 1.x, react-table 9); 4 low advisories reach production through Aura. The plan is in docs/dependency-upgrade-plan.md — package.json — 1.3
- [ ] NICE: Replace the two module mocks with an injected PDF viewer so tests need no `vi.mock` — PdfViewer.test.tsx:10, Asset360.test.tsx:56 — 1.6
- [ ] NICE: Cover the AssetPage error, no-access, retry and not-found branches, `WorkOrderDetail` fields and `TimeSeriesChart` — AssetPage.tsx:35-62, WorkOrderDetail.tsx, TimeSeriesChart.tsx — 1.4
- [ ] NICE: Use Aura `Alert` for the raw error paragraphs and a semantic token instead of `bg-muted/50` — PdfViewer.tsx:49, FileViewer.tsx:35, App.tsx:23,40 — 3.1
- [ ] NICE: `AppStateProvider.update` merges against `state` captured at render, so two updates in one tick would drop the first; use a functional state update — AppStateProvider.tsx:14 — 1.1
- [ ] NICE: Run the platform check on the new UI: `aura-review` has not been re-run since the rewrite — 3.1
- [ ] NICE: Push the `plottable` (numeric) and P&ID-name decisions into the request where possible instead of filtering in the browser — TimeSeriesService.ts:108, DocumentsPanel.tsx:45 — 2.2
- [ ] NICE: Patch updates: @tanstack/react-query 5.104.2, @tanstack/react-virtual 3.14.17, vitest and @vitest/ui 4.1.11 (fixes a moderate dev-only advisory) — package.json
