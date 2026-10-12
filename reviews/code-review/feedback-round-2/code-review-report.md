# Asset 360 — Flows code review (round 2)

This document is the platform review for Asset 360, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)**. The round 1 must-fix item (unused `src/lib/utils.ts`) is resolved. The six should-fix and seven nice-fix items below do not block approval.

### Reviewed commit
`771468cbef000a4f6519656213f6e7646cbff449`

All Asset 360 work is still uncommitted (untracked files on top of that initial commit), so this review covers the working tree as of the review run, not the commit alone. Commit before submitting so the SHA identifies the reviewed code.

## How this review was run

- Checks came from the local copies of `flows-review-checks` and `code-quality` in `.claude/skills/`. The "pull latest from cognitedata/builder-skills" step was **not** run because the pull command was declined when it was first attempted, so the bar may be slightly behind `main`.
- `code-quality` was used for its searches only; none of its fixes were applied, and no app files were edited.
- Every hunt in `review-findings.md` has hits or `none`.

## Checks performed

See [review-files.md](review-files.md) (inventory), [review-findings.md](review-findings.md) (hunt results) and [review-packages.md](review-packages.md) (package audit).

## Test coverage

Vitest 4.1.10 with `happy-dom`: 11 test files, 70 tests, all passing. Round 2 re-ran every hunt, the package audit and coverage.

**Scope:** the coverage config has no `coverage.include`, so it only measures files that tests import. No production code is excluded, and the tests that are excluded from the run are only the agent skill folders (`.claude`, `.agents`). I re-ran coverage over all of `src/**/*.{ts,tsx}` (minus tests, `main.tsx`, `__mocks__`):

| Metric | As configured | Full `src/` scope |
| ------ | ------------- | ----------------- |
| Statements | 94.52% (round 1 figure, config unchanged) | 95.12% |
| Branches | 86.4% (round 1) | 86.23% |
| Functions | 91.07% (round 1) | 92.15% |
| Lines | 95.93% (round 1) | **96.1%** |

The 80% line gate is met at full scope. Weakest files: `ChildAssetsSection.tsx` 50% lines, `AssetPage.tsx` 86.7%, `useFilesViewModel.ts` 85.7%.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4/5 | ErrorBoundary wraps the app (`App.tsx:78`); every data section has loading, error and empty states (`Section.tsx`); effects clean up. No TODOs. Minor: the boundary does not cover the providers above it. |
| User & customer | 1.3 Packages | 3/5 | 0 critical/high CVEs, nothing deprecated, lockfile present. Production deps one major behind: react/react-dom 18→19, @cognite/aura 0.3.5→1.x, @tanstack/react-table 8→9; 4 low advisories reach production through Aura; 4 moderate are dev-only (vitest). See `review-packages.md`. |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 95.8% line coverage at full scope, tests run, no production code excluded. Gaps: no `coverage.include`; the ViewModels and small helpers have no dedicated tests; ChildAssetsSection is at 50%. |
| User & customer | 1.5 Dead code | 4/5 | Round 1 Must Fix resolved: `src/lib/utils.ts`, `clsx` and `tailwind-merge` removed. Lint and `tsc` are clean, no `any`, no unused files. Minor cruft remains: a duplicated `isAssetTab` guard and a `children` data prop (Nice Fix). |
| User & customer | 1.6 Patterns & testability | 5/5 | All dependencies come through React context (`AppServices`, `AppState`); services are interface plus class with narrow client types; stateless ViewModels; `new CogniteClient` appears only in tests; no `vi.mock`; typed `vi.fn` mocks. |
| Cognite services | 2.1 DMS query patterns | 3/5 | Asset search uses `instances.search`; the other reads are four filtered `instances.list` calls plus `retrieve`, and nothing uses `instances.query`. |
| Cognite services | 2.2 Server-side filter | 4/5 | All linking filters (asset links, parent, annotation `endNode`) run in the request. Minor client-side filtering: time series type (`TimeSeriesService.ts:80`) and the file-view check on annotation start nodes (`FileService.ts`). |
| Cognite services | 2.3 Limits & pages | 3/5 | Every request has an explicit limit and nothing is prefetched, but there is no cursor paging, so results above 100 (25 for search) are silently dropped. |
| Cognite services | 2.4 Call rate | 4/5 | Search is debounced (250 ms); TanStack Query caches for 5 minutes; the download link is fetched only when a file is opened. About 10 requests per asset-page load. |
| Cognite services | 2.5 429 backoff | 3/5 | No concurrency cap and no 429 or `Retry-After` handling. TanStack's default retry (3 attempts, exponential, no jitter) is the only protection and it also retries 403/404. |
| Cognite services | 2.6 CDF Raw | N/A | No Raw usage. |
| Brand | 3.1 Aura | 4/5 | Aura Command, DataGrid, Chart, Tabs, Breadcrumb, Badge, Skeleton, EmptyState, Alert, Card and Button throughout; labeled inputs. Isolated raw bits: `<p role="alert">` errors, raw `bg-muted/50` in the fallbacks, raw `<img>`/`<iframe>` viewer. |

## Must Fix

None. Resolved since round 1: removed the unused `src/lib/utils.ts` (criterion 1.5) together with the `clsx` and `tailwind-merge` dependencies.

## Should Fix

- [ ] Add dedicated tests for the five ViewModel hooks (loading, success, error) and for `Section.tsx`, `format.ts`, `queryState.ts`, `linkedFilter.ts` — `src/*/use*ViewModel.ts` — 1.4, 1.6
- [ ] Page through results with cursors, or show a "showing first N" signal, instead of silently truncating at the limit — `TimeSeriesService.ts:47`, `FileService.ts:32`, `ActivityService.ts:28`, `AssetService.ts:46,66` — 2.3
- [ ] Add a concurrency cap and a retry policy that skips 4xx, honors `Retry-After` on 429 and adds jitter — `src/main.tsx:9` — 2.5
- [ ] Move the asset-page reads to `instances.query` (or search with the nested `assets.path` filter) to cut round trips — `AssetService.ts:62`, `TimeSeriesService.ts:71`, `FileService.ts:67`, `ActivityService.ts:34` — 2.1
- [ ] Plan the upgrade of production dependencies one major behind (react 19, @cognite/aura 1.x, react-table 9) and re-check the Aura-transitive advisories afterwards — `package.json` — 1.3
- [ ] Set `coverage.include: ['src/**/*.{ts,tsx}']` in the coverage config so unimported files count — `vitest.config.ts:19` — 1.4

## Nice Fix

- [ ] Export one `isAssetTab` guard instead of two copies — `AssetPage.tsx:25`, `appState.ts:25`
- [ ] Rename `ChildAssetsSection`'s `children` data prop — `AssetPage.tsx:113`, `ChildAssetsSection.tsx`
- [ ] Use Aura `Alert` for the datapoint and file error messages — `TimeSeriesSection.tsx:71`, `FilesSection.tsx:122`
- [ ] Use a semantic token instead of `bg-muted/50` in the fallbacks — `App.tsx:22,39`
- [ ] Filter time series by `type = numeric` in the request — `TimeSeriesService.ts:80`
- [ ] Cover the child-asset open path in tests — `ChildAssetsSection.tsx`
- [ ] Apply patch updates: @tanstack/react-query 5.104.2, @tanstack/react-virtual 3.14.15, vitest and @vitest/ui 4.1.11

## Summary

- Must Fix open: 0
- Should Fix open: 6
- Nice Fix open: 7
