# Asset 360 — Flows code review (round 3)

This document is the platform review for Asset 360, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** that block approval.

The round 1 and round 2 items are resolved. The round 3 must-fix (`react-pdf` upgrade) has been addressed.

### Reviewed commit
`771468cbef000a4f6519656213f6e7646cbff449`

All Asset 360 work is still uncommitted (untracked files on top of that initial commit), so this review covers the working tree as of the review run, not the commit alone. Commit before submitting so the SHA identifies the reviewed code.

## How this review was run

- The app was rewritten against the updated SPEC.md since round 2 (new search, time series, work order, document and recently-viewed behavior, an in-page PDF viewer), so every hunt, the package audit and coverage were re-run from scratch.
- Checks came from the local copies of `flows-review-checks` and `code-quality` in `.claude/skills/`. The "pull latest from cognitedata/builder-skills" step was **not** run, because the pull command was declined when it was first attempted, so the bar may be slightly behind `main`.
- `code-quality` was used for its searches only; none of its fixes were applied, and no app files were edited.
- Every hunt in `review-findings.md` has hits or `none`.

## Checks performed

See [review-files.md](review-files.md) (inventory), [review-findings.md](review-findings.md) (hunt results) and [review-packages.md](review-packages.md) (package audit).

## Test coverage

Vitest 4.1.10 with `happy-dom`: 30 test files, 208 tests, all passing.

**Scope:** `coverage.include` is `src/**/*.{ts,tsx}`, so every source file is measured. Only tests, test helpers, `main.tsx`, config and generated files are excluded. The only tests excluded from the run are the agent skill folders (`.claude`, `.agents`).

| Metric | Result |
| ------ | ------ |
| Statements | 97.8% |
| Branches | 89.42% |
| Functions | 97.34% |
| Lines | **99.14%** |

The 80% line gate is met. Weakest files: `AssetPage.tsx` 83.3% lines, `WorkOrderDetail.tsx` 80%, `TimeSeriesChart.tsx` 87.5%.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4/5 | App-level ErrorBoundary with reload (`App.tsx:80`) and a boundary per panel (`Panel.tsx:14`); every panel has loading, empty, error with retry and no-access states (`Section.tsx`); effects clean up; no TODOs. Minor: `AppStateProvider.update` can drop a second update made in the same tick. |
| User & customer | 1.3 Packages | 4/5 | No critical or high CVEs, nothing deprecated, lockfile present. `@cognite/aura` upgraded to 1.46472.0, `react-pdf` to 10.5.0. Remaining one-major-behind: react 18→19, react-table 8→9 (both blocked by Aura peers), Vite 7→8 and app-sdk 0.9→0.10+ (blocked by Vite). Upgrade plan documents each constraint and remaining step. 8 low (Aura-transitive), 4 moderate (dev-only vitest). |
| User & customer | 1.4 Tests & coverage | 5/5 | Honest 99.1% line coverage at full scope; no production code excluded; services, ViewModels, helpers, the PDF viewer and every panel behavior have tests. Small branch gaps in AssetPage and WorkOrderDetail. |
| User & customer | 1.5 Dead code | 4/5 | Lint and `tsc` clean, no `any`, no `as` casts in production, no unused files, no routes. File-level scan only; an unused-export scan was not run. |
| User & customer | 1.6 Patterns & testability | 4/5 | DI through context (`AppServices`, `AppState`, `RecentAssets`); interface-based services with narrow client types; stateless ViewModels; storage and scheduler injected. Two commented `vi.mock` calls stand in for an injectable PDF viewer. |
| Cognite services | 2.1 DMS query patterns | 4/5 | Search uses `instances.search`; all panel data loading uses `instances.query` with cursor pagination. The file annotation path combines edge traversal + node retrieval in a single query call. Asset retrieve still uses `instances.retrieve` (appropriate for known refs). |
| Cognite services | 2.2 Server-side filter | 4/5 | Asset links, parent, annotation `endNode` and work order filters all run in the request. Minor client-side filtering: numeric time series check and the P&ID name check. |
| Cognite services | 2.3 Limits & pages | 4/5 | Explicit page size, cursor paging up to 500 items with a visible truncation note, chart limited to 1000 points, no prefetching. |
| Cognite services | 2.4 Call rate | 4/5 | Search is debounced (250 ms); results are cached for 5 minutes; the chart never polls or refetches on focus and refreshes only on request; download links are fetched on click. Each asset-page load starts about a dozen requests. |
| Cognite services | 2.5 429 backoff | 4/5 | Exponential backoff with jitter, 3 retries, 4xx not retried (`retryPolicy.ts`). Shared `Throttle` limits CDF calls to 6 concurrent (`AppServicesProvider`). `Retry-After` is read when the SDK error carries headers (`HttpError`); `CogniteError` strips them, which is documented. |
| Cognite services | 2.6 CDF Raw | N/A | No Raw usage. |
| Brand | 3.1 Aura | 4/5 | Aura Command, DataGrid, Chart, Checkbox, Dialog, Breadcrumb, Badge, Skeleton, EmptyState, Alert, Card and Button throughout; labeled controls and toolbars. Isolated raw bits: error paragraphs, `bg-muted/50` in the fallbacks. |

## Must Fix

- [x] ~~**Upgrade `react-pdf` to a React 18-compatible current version and document the rest of the path.**~~ Done: upgraded to 10.5.0 (one major behind; 11 needs React 19). Documented in `docs/dependency-upgrade-plan.md`. — criterion 1.3

## Should Fix

- [x] ~~**Move the panel reads to `instances.query`.**~~ Done: all three services (`TimeSeriesService`, `WorkOrderService`, `FileService`) migrated from `instances.list` to `instances.query` with cursor pagination via `queryPages`. The file annotation path now combines edge traversal + node retrieval in a single query call. — 2.1
- [x] ~~**Add a concurrency cap and read `Retry-After`.**~~ Done: `Throttle` class limits concurrent CDF requests to 6 (wired in `AppServicesProvider`). `retryPolicy.ts` reads `Retry-After` from both `retry-after` and `Retry-After` header keys; documented that `CogniteError` strips headers so the floor is only effective when `HttpError` reaches the retry handler. — 2.5
- [x] ~~**Follow the dependency upgrade plan.**~~ Done: Aura upgraded from 0.3.5 to 1.46472.0, `react-virtual` patched, upgrade plan updated with completed/remaining steps. Remaining: app-sdk 0.10+ (needs Vite 8), Vite 7→8, vitest 4→5. — 1.3

## Nice Fix

- [ ] Inject the PDF viewer through context so the two `vi.mock` calls can go — `PdfViewer.test.tsx:10`, `Asset360.test.tsx:56`
- [ ] Cover the AssetPage error, no-access, retry and not-found branches, `WorkOrderDetail` and `TimeSeriesChart` — `AssetPage.tsx:35-62`
- [ ] Use Aura `Alert` for the raw error paragraphs and a semantic token for the fallback background — `PdfViewer.tsx:49`, `FileViewer.tsx:35`, `App.tsx:23,40`
- [ ] Use a functional state update in `AppStateProvider.update` — `AppStateProvider.tsx:14`
- [ ] Re-run `aura-review` on the rewritten UI
- [ ] Push the numeric-series and P&ID decisions into the request where possible — `TimeSeriesService.ts:108`, `DocumentsPanel.tsx:45`
- [x] ~~Apply patch updates: @tanstack/react-virtual 3.14.15.~~ Remaining: vitest and @vitest/ui (major version bump to 5.x, documented in upgrade plan)

## Summary

- Must Fix open: 0
- Should Fix open: 0
- Nice Fix open: 6
