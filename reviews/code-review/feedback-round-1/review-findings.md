# Findings: Asset 360

## Config inspected
- Coverage config file(s): `vitest.config.ts` (v8 provider; `vite.config.ts` has no `test` block)
- Production paths excluded from coverage: none. Excludes are `node_modules/`, `dist/`, `.claude/`, `.agents/`, `vitest.setup.ts`, `**/*.config.ts`, `**/*.d.ts`. There is **no `coverage.include`**, so only files loaded by tests are measured; a full-scope run (`src/**/*.{ts,tsx}` minus tests, `main.tsx`, `__mocks__`) was done to check.
- Tests excluded from the test run: `.claude/**`, `.agents/**` (agent skill folders, not app tests), plus vitest defaults.

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | src/lib/ErrorBoundary.tsx (getDerivedStateFromError, componentDidCatch); used at src/App.tsx:78 around `Asset360` |
| TODO/FIXME | none |
| useEffect cleanup | src/App.tsx:61 (cancel flag), src/lib/useDebouncedValue.ts:19 (clears timer), src/asset360/AssetSearch.tsx:19 (no async/timer; `eslint-disable` at :22) |
| loading/error/empty | Section.tsx (all three), AssetSearch.tsx:39, AssetPage.tsx:33 and error/not-found branch, TimeSeriesSection.tsx:68-71, FilesSection.tsx:121-123 |
| coverage/test exclude | see Config inspected |
| CDF Raw | none |
| instances.list/query/search | search: AssetService.ts:49. list: AssetService.ts:62, TimeSeriesService.ts:71, FileService.ts:67 and :78 (edges), ActivityService.ts:34. retrieve: AssetService.ts:72, FileService.ts:91. No `query`/`aggregate`. |
| QueuedTaskRunner / 429 | none; no `Retry-After`, no backoff code. TanStack Query default retry (3, exponential, no jitter) applies; `src/main.tsx` sets only `staleTime`/`gcTime` |
| any / vi.mock | none / none |
| createContext/useContext | src/state/appStateContext.ts, src/services/AppServices.ts, AppServicesProvider.tsx |
| hooks relative imports | no `src/hooks/` directory |
| CogniteClient | only in tests (`src/App.test.tsx:90,97` via `createClient`); none in production |
| service classes | ApiTimeSeriesService, ApiFileService, ApiActivityService, ApiAssetService, each `implements` an interface |
| pages with SDK/query | no `src/pages` or `src/views`; the `src/asset360` components call ViewModels only |
| ViewModels | useAssetSearchViewModel, useAssetViewModel, useTimeSeriesViewModel, useFilesViewModel, useActivitiesViewModel |
| console.log/debug | none (`console.error` in ErrorBoundary only) |
| routes | none (single-view app, state host-synced) |
| lint / tsc | `npm run lint` clean; `tsc --noEmit` exit 0 |
| unused files | **src/lib/utils.ts** (`cn()`; nothing imports it) |
| components > 150 lines | none (largest: FilesSection.tsx 138; largest overall is a test, 227) |

Coverage (framework Vitest 4.1.10, 11 files, 70 tests, all pass):
- As configured: 94.52% statements, 86.4% branches, 91.07% functions, 95.93% lines.
- Full `src/` scope: 94.85% statements, 86.23% branches, 91.55% functions, **95.79% lines** (≥ 80%). `src/lib/utils.ts` is at 0%. Lowest: ChildAssetsSection.tsx 50% lines, AssetPage.tsx 86.7%, AssetService/FileService view models 85-93%.

## Must / should / nice
- [ ] MUST: Unused file `src/lib/utils.ts` (template `cn()` helper) and the two dependencies only it uses, `clsx` and `tailwind-merge` — src/lib/utils.ts:1 — 1.5
- [ ] SHOULD: No dedicated tests for the five ViewModel hooks (loading, success, error per CLAUDE.md §6) or for Section.tsx, format.ts, queryState.ts, linkedFilter.ts, views.ts; they are only covered through the integration tests — src/*/use*ViewModel.ts — 1.4, 1.6
- [ ] SHOULD: Lists stop at a fixed limit with no cursor paging or "more results" signal, so results are silently truncated (100 files/activities/time series/children, 25 search hits) — TimeSeriesService.ts:47, FileService.ts:32, ActivityService.ts:28, AssetService.ts:46,66 — 2.3
- [ ] SHOULD: No concurrency cap or 429 handling. An asset page fires about 10 CDF requests at once and relies on TanStack's default retry, which also retries 403/404 and has no jitter or `Retry-After` handling — src/main.tsx:9 — 2.5
- [ ] SHOULD: Four filtered `instances.list` calls for read paths that could use `instances.query` (one round trip for the asset's linked data) or search with the nested `assets.path` filter — AssetService.ts:62, TimeSeriesService.ts:71, FileService.ts:67, ActivityService.ts:34 — 2.1
- [ ] SHOULD: Production dependencies one major behind: react/react-dom 18→19, @cognite/aura 0.3.5→1.x, @tanstack/react-table 8→9 (Aura peer); 4 low advisories reach production through Aura; plan the upgrade — package.json — 1.3
- [ ] SHOULD: `coverage.include` is not set, so files that no test imports are invisible to the coverage number — vitest.config.ts:19 — 1.4
- [ ] NICE: Duplicate `isAssetTab` guard — AssetPage.tsx:25 and appState.ts:25; export one
- [ ] NICE: `ChildAssetsSection` takes a prop named `children` that holds data; rename (e.g. `assets`) — AssetPage.tsx:113, ChildAssetsSection.tsx
- [ ] NICE: Raw `<p role="alert">` error text instead of Aura `Alert` — TimeSeriesSection.tsx:71, FilesSection.tsx:122
- [ ] NICE: Raw `bg-muted/50` in the loading/error fallbacks instead of a semantic token — App.tsx:22,39
- [ ] NICE: Time series type filter runs client-side after the list call; push `type = numeric` into the request — TimeSeriesService.ts:80
- [ ] NICE: ChildAssetsSection row-open path is untested (50% line coverage) — ChildAssetsSection.tsx
- [ ] NICE: Patch updates available: @tanstack/react-query 5.104.2, @tanstack/react-virtual 3.14.15, vitest/@vitest/ui 4.1.11 (fixes a moderate dev-only advisory)
